import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, isDbConnected } from '../../lib/db';
import { verifyAuth } from '../../lib/auth';
import { ProjectSchema, formatZodErrors } from '../../lib/validators';
import Project from '../../models/Project';
import { enrichProjects } from '../../lib/projects';
import { normalizeImageForStorage } from '../../lib/s3';

/**
 * Seed data shown when the database is empty or unreachable.
 * Keeps the portfolio looking complete during first-time setup.
 */
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

/**
 * /api/projects
 *
 * GET  — Public. Returns all projects sorted by `order` asc.
 *        Falls back to SEED_PROJECTS if DB is unavailable.
 *        Auto-seeds the database if connected but empty.
 *
 * POST — Protected (JWT). Creates a new project.
 *        Body: { title, description, image, link, order? }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── GET /api/projects ─────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      await connectDB();

      if (!isDbConnected()) {
        console.warn('[projects/index] DB not connected — returning seed data');
        return res.status(200).json(await enrichProjects(SEED_PROJECTS));
      }

      let projects = await Project.find().sort({ order: 1 }).lean();

      // Auto-seed on first run
      if (projects.length === 0) {
        console.log('[projects/index] Collection empty — seeding initial data');
        projects = await Project.insertMany(SEED_PROJECTS);
      }

      return res.status(200).json(await enrichProjects(projects as any));
    } catch (error) {
      console.error('[projects/index] GET error:', error);
      return res.status(200).json(await enrichProjects(SEED_PROJECTS)); // graceful fallback
    }
  }

  // ── POST /api/projects ────────────────────────────────────────────────────
  if (req.method === 'POST') {
    // Require valid JWT
    const admin = verifyAuth(req, res);
    if (!admin) return;

    // Validate body
    const parsed = ProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: formatZodErrors(parsed.error) });
    }

    try {
      await connectDB();

      if (!isDbConnected()) {
        return res
          .status(503)
          .json({ message: 'Database not connected. Cannot perform write operations.' });
      }

      const { title, description, image, link, order } = parsed.data;
      const storedImage = normalizeImageForStorage(image);

      // Determine display order — append at end if not explicitly set
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
      console.error('[projects/index] POST error:', error);
      return res.status(500).json({ message: 'Failed to create project' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
