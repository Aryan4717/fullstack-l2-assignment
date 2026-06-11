import type { Request, Response, NextFunction } from 'express';
import type { ISubmissionService } from '../interfaces/services/ISubmissionService';
import { ResponseFactory } from '../utils/response.factory';

export class SubmissionController {
  constructor(private readonly submissionService: ISubmissionService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query['status'] as string | undefined;
      const type = req.query['type'] as string | undefined;
      const search = req.query['search'] as string | undefined;
      const page = req.query['page'] ? parseInt(req.query['page'] as string, 10) : 1;
      const limit = req.query['limit'] ? Math.min(parseInt(req.query['limit'] as string, 10), 100) : 10;

      const { data, total } = await this.submissionService.getSubmissions({
        status: status as never,
        type: type as never,
        search,
        page,
        limit,
      });

      const { status: s, body } = ResponseFactory.paginated(data, total, page, limit);
      res.status(s).json(body);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const submission = await this.submissionService.getSubmissionById(id);
      const { status, body } = ResponseFactory.success(submission);
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submission = await this.submissionService.createSubmission(req.body);
      const { status, body } = ResponseFactory.created(submission, 'Submission created');
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const moderatorId = req.user!.id;
      const submission = await this.submissionService.updateStatus(id, req.body, moderatorId);
      const { status, body } = ResponseFactory.success(submission, 'Status updated');
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  };

  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.submissionService.getStats();
      const { status, body } = ResponseFactory.success(stats);
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  };
}
