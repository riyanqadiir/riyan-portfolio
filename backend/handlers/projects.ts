import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, isDbConnected } from '../lib/db';
import { verifyAuth } from '../lib/auth';
import { ProjectSchema, formatZodErrors } from '../lib/validators';
import Project from '../models/Project';
import { enrichProjects } from '../lib/projects';
import { normalizeImageForStorage, uploadToS3, getSignedImageUrl } from '../lib/s3';
import multer from 'multer';

const SEED_PROJECTS = [
  {
    title: 'The Global IT Solutions Website',
    description:
      "Developed and improved the company's official website. Enhanced responsiveness, design structure, accessibility, and implemented reusable components with API integrations. Built using React.js, Node.js, Express.js, and MongoDB.",
    image: '/GitSol.png',
    link: 'https://www.theglobalitsolutions.com/',
    order: 0,
  },
  {
    title: 'TaskMaster – Task Management App',
    description:
      'A clean and modern productivity web app built using React.js and Node.js. Allows users to create, update, categorize, and track tasks efficiently. Features include filtering, priorities, responsive UI, and a smooth user experience.',
    image: '/TaskMaster.png',
    link: 'https://taskmaster-app-ashen.vercel.app/',
    order: 1,
  },
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
    } else {
      cb(null, true);
    }
  },
});

function runMulter(req: VercelRequest, res: VercelResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    upload.single('image')(req as any, res as any, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function handleProjectsRoot(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      await connectDB();
      if (!isDbConnected()) {
        return res.status(200).json(await enrichProjects(SEED_PROJECTS));
      }

      let projects = await Project.find().sort({ order: 1 }).lean();
      if (projects.length === 0) {
        projects = await Project.insertMany(SEED_PROJECTS);
      }
      return res.status(200).json(await enrichProjects(projects as any));
    } catch (error) {
      console.error('[projects] GET error:', error);
      return res.status(200).json(await enrichProjects(SEED_PROJECTS));
    }
  }

  if (req.method === 'POST') {
    const admin = verifyAuth(req, res);
    if (!admin) return;

    const parsed = ProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: formatZodErrors(parsed.error) });
    }

    try {
      await connectDB();
      if (!isDbConnected()) {
        return res.status(503).json({ message: 'Database not connected. Cannot perform write operations.' });
      }

      const { title, description, image, link, order } = parsed.data;
      const storedImage = normalizeImageForStorage(image);

      let projectOrder = order;
      if (projectOrder === undefined) {
        const last = await Project.findOne().sort({ order: -1 }).lean();
        projectOrder = last ? (last as any).order + 1 : 0;
      }

      const project = await Project.create({
        title,
        description,
        image: storedImage,
        link,
        order: projectOrder,
      });
      return res.status(201).json(project);
    } catch (error) {
      console.error('[projects] POST error:', error);
      return res.status(500).json({ message: 'Failed to create project' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export async function handleProjectById(req: VercelRequest, res: VercelResponse, id: string) {
  const admin = verifyAuth(req, res);
  if (!admin) return;

  if (req.method === 'PUT') {
    const parsed = ProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: formatZodErrors(parsed.error) });
    }

    try {
      await connectDB();
      if (!isDbConnected()) {
        return res.status(503).json({ message: 'Database not connected. Cannot perform write operations.' });
      }

      const { title, description, image, link, order } = parsed.data;
      const storedImage = normalizeImageForStorage(image);

      const updated = await Project.findByIdAndUpdate(
        id,
        {
          title,
          description,
          image: storedImage,
          link,
          ...(order !== undefined && { order }),
        },
        { new: true, runValidators: true }
      );

      if (!updated) return res.status(404).json({ message: 'Project not found' });
      return res.status(200).json(updated);
    } catch (error) {
      console.error('[projects] PUT error:', error);
      return res.status(500).json({ message: 'Failed to update project' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await connectDB();
      if (!isDbConnected()) {
        return res.status(503).json({ message: 'Database not connected. Cannot perform write operations.' });
      }

      const deleted = await Project.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'Project not found' });
      return res.status(200).json({ message: 'Project deleted successfully', id });
    } catch (error) {
      console.error('[projects] DELETE error:', error);
      return res.status(500).json({ message: 'Failed to delete project' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export async function handleProjectUpload(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const admin = verifyAuth(req, res);
  if (!admin) return;

  try {
    await runMulter(req, res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'File upload error';
    return res.status(400).json({ message });
  }

  interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  }

  const file = (req as VercelRequest & { file?: UploadedFile }).file;
  if (!file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  try {
    const imageKey = await uploadToS3(file.buffer, file.originalname, file.mimetype);
    const imageUrl = await getSignedImageUrl(imageKey);
    return res.status(200).json({ imageKey, imageUrl });
  } catch (error) {
    console.error('[projects] upload error:', error);
    return res.status(500).json({ message: 'File upload to S3 failed' });
  }
}
