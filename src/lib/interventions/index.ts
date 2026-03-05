/**
 * Interventions Module
 * ====================
 *
 * Layer 3: Intervention Workflow Management
 *
 * Exports for intervention planning, tracking, and team collaboration.
 */

export {
  InterventionWorkflowManager,
  createWorkflowManager,
  INTERVENTION_TEMPLATES,
  type InterventionType,
  type InterventionStatus,
  type InterventionPriority,
  type WorkflowState,
  type InterventionTemplate,
  type MilestoneTemplate,
  type Resource,
  type ProgressEntry,
  type Milestone,
  type CheckItem,
  type EffectivenessScore,
} from './workflow-manager';

export {
  TeamCollaborationManager,
  createTeamManager,
  type TeamRole,
  type TeamMember,
  type TeamPermissions,
  type TeamTask,
  type TeamComment,
  type TeamMeeting,
  type Attachment,
} from './team-collaboration';
