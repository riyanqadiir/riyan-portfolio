import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureJsonBody, getApiPathSegments } from '../backend/lib/request-body';
import { handleHealth } from '../backend/handlers/health';
import { handleContact } from '../backend/handlers/contact';
import { handleAuthLogin } from '../backend/handlers/auth';
import {
  handleProjectsRoot,
  handleProjectById,
  handleProjectUpload,
} from '../backend/handlers/projects';
import { handleExpertiseRoot, handleExpertiseById } from '../backend/handlers/expertise';
import {
  handleTimelineRoot,
  handleTimelineById,
  handleTimelineNormalize,
} from '../backend/handlers/timeline';
import { handleResumeGet, handleResumeUpload } from '../backend/handlers/resume';
import { handleProfilePhotoGet, handleProfilePhotoUpload } from '../backend/handlers/profile-photo';

/**
 * Single API entry point for Vercel Hobby (1 serverless function).
 * vercel.json rewrites all /api/* → /api/index?path=...
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const segments = getApiPathSegments(req);
  const resource = segments[0];

  try {
    // ── /api/health ───────────────────────────────────────────────────────
    if (resource === 'health' && segments.length === 1) {
      return handleHealth(req, res);
    }

    // ── /api/contact ──────────────────────────────────────────────────────
    if (resource === 'contact' && segments.length === 1) {
      await ensureJsonBody(req);
      return handleContact(req, res);
    }

    // ── /api/auth/login ───────────────────────────────────────────────────
    if (resource === 'auth' && segments[1] === 'login' && segments.length === 2) {
      await ensureJsonBody(req);
      return handleAuthLogin(req, res);
    }

    // ── /api/projects ─────────────────────────────────────────────────────
    if (resource === 'projects') {
      if (segments.length === 1) {
        await ensureJsonBody(req);
        return handleProjectsRoot(req, res);
      }
      if (segments.length === 2 && segments[1] === 'upload') {
        return handleProjectUpload(req, res);
      }
      if (segments.length === 2) {
        await ensureJsonBody(req);
        return handleProjectById(req, res, segments[1]);
      }
    }

    // ── /api/expertise ────────────────────────────────────────────────────
    if (resource === 'expertise') {
      if (segments.length === 1) {
        await ensureJsonBody(req);
        return handleExpertiseRoot(req, res);
      }
      if (segments.length === 2) {
        await ensureJsonBody(req);
        return handleExpertiseById(req, res, segments[1]);
      }
    }

    // ── /api/timeline ─────────────────────────────────────────────────────
    if (resource === 'timeline') {
      if (segments.length === 1) {
        await ensureJsonBody(req);
        return handleTimelineRoot(req, res);
      }
      if (segments.length === 2 && segments[1] === 'normalize') {
        return handleTimelineNormalize(req, res);
      }
      if (segments.length === 2) {
        await ensureJsonBody(req);
        return handleTimelineById(req, res, segments[1]);
      }
    }

    // ── /api/resume ───────────────────────────────────────────────────────
    if (resource === 'resume') {
      if (segments.length === 1) {
        return handleResumeGet(req, res);
      }
      if (segments.length === 2 && segments[1] === 'upload') {
        return handleResumeUpload(req, res);
      }
    }

    // ── /api/profile-photo ────────────────────────────────────────────────
    if (resource === 'profile-photo') {
      if (segments.length === 1) {
        return handleProfilePhotoGet(req, res);
      }
      if (segments.length === 2 && segments[1] === 'upload') {
        return handleProfilePhotoUpload(req, res);
      }
    }

    return res.status(404).json({ message: `API route not found: /api/${segments.join('/')}` });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid JSON body') {
      return res.status(400).json({ message: 'Invalid JSON body' });
    }
    console.error('[api/index] error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export const config = {
  api: { bodyParser: false },
};
