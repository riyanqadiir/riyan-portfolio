import { normalizeImageForStorage, resolveImageUrl } from './s3';

export interface ProjectRecord {
  _id?: unknown;
  title: string;
  description: string;
  image: string;
  link: string;
  order?: number;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface ProjectWithImageUrl extends ProjectRecord {
  imageUrl: string;
}

/** Adds `imageUrl` for browser display; keeps `image` as the stored S3 key or path. */
export async function enrichProject(
  project: ProjectRecord
): Promise<ProjectWithImageUrl> {
  const image = normalizeImageForStorage(project.image);
  const imageUrl = await resolveImageUrl(image);
  return { ...project, image, imageUrl };
}

export async function enrichProjects(
  projects: ProjectRecord[]
): Promise<ProjectWithImageUrl[]> {
  return Promise.all(projects.map(enrichProject));
}
