import { Request, Response } from 'express';
import { ApiError } from '../utils/ApiErrors';
import { ApiResponse } from '../utils/ApiResponse';
import { getTeamByIdAndWorkspaceId } from '../services/teams.service';
import {
  createTeamDocument,
  createTeamLink,
  deleteTeamDocument,
  deleteTeamLink,
  getTeamDocument,
  getTeamDocuments,
  getTeamLink,
  getTeamLinks,
  updateTeamDocument,
  updateTeamLink,
} from '../services/teamResources.service';
import {
  CreateTeamDocumentBodySchema,
  CreateTeamDocumentParamsSchema,
  CreateTeamLinkBodySchema,
  CreateTeamLinkParamsSchema,
  DeleteTeamDocumentParamsSchema,
  DeleteTeamLinkParamsSchema,
  GetTeamDocumentParamsSchema,
  GetTeamDocumentsParamsSchema,
  GetTeamLinkParamsSchema,
  GetTeamLinksParamsSchema,
  UpdateTeamDocumentBodySchema,
  UpdateTeamDocumentParamsSchema,
  UpdateTeamLinkBodySchema,
  UpdateTeamLinkParamsSchema,
} from '../schemas/teamResources.schema';

// ==================================================================================
// Helpers
// ==================================================================================

const requireTeam = async (teamId: string, workspaceId: string) => {
  const team = await getTeamByIdAndWorkspaceId(teamId, workspaceId);
  if (!team) throw ApiError.notFound('Team not found');
  return team;
};

const formatDocument = (
  document: Awaited<ReturnType<typeof getTeamDocument>>,
) => ({
  id: document.id,
  teamId: document.team_id,
  createdBy: document.created_by
    ? {
        id: document.created_by,
        name:
          document.created_by_full_name ||
          document.created_by_username ||
          'Unknown user',
      }
    : null,
  name: document.name,
  content: document.content,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
});

const formatLink = (link: Awaited<ReturnType<typeof getTeamLink>>) => ({
  id: link.id,
  teamId: link.team_id,
  createdBy: link.created_by
    ? {
        id: link.created_by,
        name:
          link.created_by_full_name ||
          link.created_by_username ||
          'Unknown user',
      }
    : null,
  title: link.title,
  url: link.url,
  createdAt: link.created_at,
  updatedAt: link.updated_at,
});

// ==================================================================================
// Team Resource Controllers
// ==================================================================================

export const GetTeamDocuments = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId } = GetTeamDocumentsParamsSchema.parse(req.params);
  const team = await requireTeam(teamId, user.activeWorkspace);
  const documents = await getTeamDocuments(team.id);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        'Team documents fetched',
        documents.map(formatDocument),
      ),
    );
};

export const CreateTeamDocument = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId } = CreateTeamDocumentParamsSchema.parse(req.params);
  const { name, content } = CreateTeamDocumentBodySchema.parse(req.body);
  const team = await requireTeam(teamId, user.activeWorkspace);
  const createdDocument = await createTeamDocument(
    team.id,
    name,
    content,
    user.id,
  );
  const document = await getTeamDocument(createdDocument.id, team.id);

  res
    .status(201)
    .json(
      new ApiResponse(201, 'Team document created', formatDocument(document)),
    );
};

export const GetTeamDocument = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId, documentId } = GetTeamDocumentParamsSchema.parse(req.params);
  const team = await requireTeam(teamId, user.activeWorkspace);
  const document = await getTeamDocument(documentId, team.id);
  if (!document) throw ApiError.notFound('Team document not found');

  res
    .status(200)
    .json(
      new ApiResponse(200, 'Team document fetched', formatDocument(document)),
    );
};

export const UpdateTeamDocument = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId, documentId } = UpdateTeamDocumentParamsSchema.parse(
    req.params,
  );
  const fields = UpdateTeamDocumentBodySchema.parse(req.body);
  const team = await requireTeam(teamId, user.activeWorkspace);
  const document = await getTeamDocument(documentId, team.id);
  if (!document) throw ApiError.notFound('Team document not found');

  await updateTeamDocument(document.id, team.id, fields);
  const updatedDocument = await getTeamDocument(document.id, team.id);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        'Team document updated',
        formatDocument(updatedDocument),
      ),
    );
};

export const DeleteTeamDocument = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId, documentId } = DeleteTeamDocumentParamsSchema.parse(
    req.params,
  );
  const team = await requireTeam(teamId, user.activeWorkspace);
  const deletedRows = await deleteTeamDocument(documentId, team.id);
  if (!deletedRows) throw ApiError.notFound('Team document not found');

  res.status(200).json(new ApiResponse(200, 'Team document deleted'));
};

export const GetTeamLinks = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId } = GetTeamLinksParamsSchema.parse(req.params);
  const team = await requireTeam(teamId, user.activeWorkspace);
  const links = await getTeamLinks(team.id);

  res
    .status(200)
    .json(new ApiResponse(200, 'Team links fetched', links.map(formatLink)));
};

export const CreateTeamLink = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId } = CreateTeamLinkParamsSchema.parse(req.params);
  const { title, url } = CreateTeamLinkBodySchema.parse(req.body);
  const team = await requireTeam(teamId, user.activeWorkspace);
  const createdLink = await createTeamLink(team.id, title, url, user.id);
  const link = await getTeamLink(createdLink.id, team.id);

  res
    .status(201)
    .json(new ApiResponse(201, 'Team link created', formatLink(link)));
};

export const GetTeamLink = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId, linkId } = GetTeamLinkParamsSchema.parse(req.params);
  const team = await requireTeam(teamId, user.activeWorkspace);
  const link = await getTeamLink(linkId, team.id);
  if (!link) throw ApiError.notFound('Team link not found');

  res
    .status(200)
    .json(new ApiResponse(200, 'Team link fetched', formatLink(link)));
};

export const UpdateTeamLink = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId, linkId } = UpdateTeamLinkParamsSchema.parse(req.params);
  const fields = UpdateTeamLinkBodySchema.parse(req.body);
  const team = await requireTeam(teamId, user.activeWorkspace);
  const link = await getTeamLink(linkId, team.id);
  if (!link) throw ApiError.notFound('Team link not found');

  await updateTeamLink(link.id, team.id, fields);
  const updatedLink = await getTeamLink(link.id, team.id);

  res
    .status(200)
    .json(new ApiResponse(200, 'Team link updated', formatLink(updatedLink)));
};

export const DeleteTeamLink = async (req: Request, res: Response) => {
  const user = req.user;
  const { teamId, linkId } = DeleteTeamLinkParamsSchema.parse(req.params);
  const team = await requireTeam(teamId, user.activeWorkspace);
  const deletedRows = await deleteTeamLink(linkId, team.id);
  if (!deletedRows) throw ApiError.notFound('Team link not found');

  res.status(200).json(new ApiResponse(200, 'Team link deleted'));
};
