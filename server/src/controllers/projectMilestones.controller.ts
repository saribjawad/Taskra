import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import {
  CreateProjectMilestonesBodySchema,
  CreateProjectMilestonesParamsSchema,
  DeleteProjectMilestonesParamsSchema,
  UpdateProjectMilestonesBodySchema,
  UpdateProjectMilestonesParamsSchema,
} from '../schemas/projectMilestones.schema';
import { getProjectByIdAndWorkspaceId } from '../services/projects.service';
import { ApiError } from '../utils/ApiErrors';
import {
  createProjectMilestones,
  deleteProjectMilestone,
  getProjectMilestonesWithIdAndProjectId,
  updateProjectMilestones,
} from '../services/projectMilestones.service';

export const CreateMilestone = async (req: Request, res: Response) => {
  const user = req.user;
  const { projectId } = CreateProjectMilestonesParamsSchema.parse(req.params);

  const { name, description, targetDate } =
    CreateProjectMilestonesBodySchema.parse(req.body);

  const project = await getProjectByIdAndWorkspaceId(
    projectId,
    user.activeWorkspace,
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const createdProjectMilestone = await createProjectMilestones(
    project.id,
    name,
    description,
    targetDate,
  );

  if (!createdProjectMilestone) {
    throw ApiError.notFound(
      'Something went wrong while creating project milestone',
    );
  }

  res.status(201).json(new ApiResponse(201, 'Milestone created'));
};

export const UpdateMilestones = async (req: Request, res: Response) => {
  const user = req.user;
  const { projectId, milestoneId } = UpdateProjectMilestonesParamsSchema.parse(
    req.params,
  );

  const { name, description, targetDate } =
    UpdateProjectMilestonesBodySchema.parse(req.body);

  const project = await getProjectByIdAndWorkspaceId(
    projectId,
    user.activeWorkspace,
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const projectMilestone = await getProjectMilestonesWithIdAndProjectId(
    milestoneId,
    projectId,
  );

  if (!projectMilestone) {
    throw ApiError.notFound('Project milestone not found');
  }

  const updatedRowsCount = await updateProjectMilestones(
    milestoneId,
    Object.fromEntries(
      Object.entries({
        name,
        description,
        target_date: targetDate,
      }).filter(([, value]) => value !== undefined),
    ),
  );

  if (!updatedRowsCount || updatedRowsCount <= 0) {
    throw ApiError.notFound(
      'Something went wrong while updating project milestone',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Milestone updated'));
};

export const DeleteMilestones = async (req: Request, res: Response) => {
  const user = req.user;
  const { milestoneId, projectId } = DeleteProjectMilestonesParamsSchema.parse(
    req.params,
  );

  const project = await getProjectByIdAndWorkspaceId(
    projectId,
    user.activeWorkspace,
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const projectMilestone = await getProjectMilestonesWithIdAndProjectId(
    milestoneId,
    projectId,
  );

  if (!projectMilestone) {
    throw ApiError.notFound('Project milestone not found');
  }

  const deleteRowCount = await deleteProjectMilestone(projectMilestone.id);

  if (!deleteRowCount || deleteRowCount <= 0) {
    throw ApiError.internal('Something went wrong while deleting milestone');
  }

  res.status(200).json(new ApiResponse(200, 'Deleted milestones'));
};
