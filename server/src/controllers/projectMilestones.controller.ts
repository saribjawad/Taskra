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
import { createProjectActivity } from '../services/projectActivity.service';
import { ProjectMilestone } from '../models/projectMilestones.model';
import { ProjectActivityType } from '../models/projectActivity.model';

async function requireProject(projectId: string, workspaceId: string) {
  const project = await getProjectByIdAndWorkspaceId(projectId, workspaceId);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  return project;
}

// ==================================================================================
// Project Milestone Controllers
// ==================================================================================

export const CreateMilestone = async (req: Request, res: Response) => {
  const user = req.user;
  const { projectId } = CreateProjectMilestonesParamsSchema.parse(req.params);

  const { name, description, targetDate } =
    CreateProjectMilestonesBodySchema.parse(req.body);

  const project = await requireProject(projectId, user.activeWorkspace);

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

  // Create project activity
  const createdProjectActivity = await createProjectActivity({
    projectId: project.id,
    userId: user.id,
    description: `${user.email} added ${createdProjectMilestone.name} milestone`,
    type: 'milestone_added',
  });

  if (!createdProjectActivity) {
    throw ApiError.internal(
      'Something went wrong while creating project activity',
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

  const project = await requireProject(projectId, user.activeWorkspace);

  const projectMilestone = await getProjectMilestonesWithIdAndProjectId(
    milestoneId,
    projectId,
  );

  if (!projectMilestone) {
    throw ApiError.notFound('Project milestone not found');
  }

  const payload = Object.fromEntries(
    Object.entries({
      name,
      description,
      target_date: targetDate,
    }).filter(([, value]) => value !== undefined),
  );
  const updatedRowsCount = await updateProjectMilestones(milestoneId, payload);

  if (!updatedRowsCount || updatedRowsCount <= 0) {
    throw ApiError.notFound(
      'Something went wrong while updating project milestone',
    );
  }

  const activityMap = {
    name: 'milestone_changed',
    description: 'milestone_changed',
    target_date: 'milestone_changed',
  };
  for (const [field, activityType] of Object.entries(activityMap)) {
    if (
      payload[field] !== undefined &&
      payload[field] !== projectMilestone[field as keyof ProjectMilestone]
    ) {
      let description = `${user.email} updated ${field} to ${payload[field]}`;

      if (payload[field] === 'target_date') {
        description = `${user.email} updated target date to ${payload[field]}`;
      }

      const createdProjectActivity = await createProjectActivity({
        projectId: project.id,
        userId: user.id,
        description,
        type: activityType as ProjectActivityType,
      });

      if (!createdProjectActivity) {
        throw ApiError.internal(
          'Something went wrong while creating project activity',
        );
      }
    }
  }

  res.status(200).json(new ApiResponse(200, 'Milestone updated'));
};

export const DeleteMilestones = async (req: Request, res: Response) => {
  const user = req.user;
  const { milestoneId, projectId } = DeleteProjectMilestonesParamsSchema.parse(
    req.params,
  );

  const project = await requireProject(projectId, user.activeWorkspace);

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

  // Create project activity
  const createdProjectActivity = await createProjectActivity({
    projectId: project.id,
    userId: user.id,
    description: `${user.email} removed ${projectMilestone.name} milestone`,
    type: 'milestone_removed',
  });

  if (!createdProjectActivity) {
    throw ApiError.internal(
      'Something went wrong while creating project activity',
    );
  }

  res.status(200).json(new ApiResponse(200, 'Deleted milestones'));
};
