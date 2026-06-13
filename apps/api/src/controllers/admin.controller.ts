import type { Request, Response, NextFunction } from 'express';
import type { ISubmissionRepository } from '../interfaces/repositories/ISubmissionRepository';
import { ContentType } from '@repo/database';
import { ResponseFactory } from '../utils/response.factory';
import { getAuditService, AuditAction } from '../services/audit.service';

const SEED_SUBMISSIONS = [
  { title: 'The Future of Renewable Energy', body: 'Solar and wind power are transforming energy markets globally. Costs have fallen by 90% over the past decade...', authorName: 'Alex Green', type: ContentType.ARTICLE },
  { title: 'Why Public Transit Matters', body: 'Investing in public transit reduces carbon emissions and improves urban mobility for all residents...', authorName: 'Jordan Miles', type: ContentType.ARTICLE },
  { title: 'This article is completely wrong!', body: 'I cannot believe anyone would publish such nonsense. The author clearly has no idea what they are talking about...', authorName: 'Angry User', type: ContentType.COMMENT },
  { title: 'Machine Learning in Healthcare', body: 'AI-assisted diagnostics are showing promise in early detection of cancers and rare diseases...', authorName: 'Dr. Priya Sharma', type: ContentType.ARTICLE },
  { title: 'Book Review: Dune', body: 'Frank Herbert\'s epic is a masterpiece of world-building that remains as relevant today as it was in 1965...', authorName: 'Literary Fan', type: ContentType.COMMENT },
  { title: 'Local election results spark debate', body: 'The narrow margin of victory has led to calls for a recount from the opposing party...', authorName: 'News Desk', type: ContentType.ARTICLE },
  { title: 'Hate this so much', body: 'This content is absolutely terrible and everyone who likes it is an idiot with no taste whatsoever...', authorName: 'TrollAccount99', type: ContentType.COMMENT },
  { title: 'Recipe: Classic Neapolitan Pizza', body: 'Using a high-protein flour, San Marzano tomatoes, and buffalo mozzarella is the key to authentic Neapolitan pizza...', authorName: 'Chef Marco', type: ContentType.ARTICLE },
  { title: 'Open Source Software in 2024', body: 'The open source ecosystem continues to thrive with record contributions and corporate sponsorships...', authorName: 'Dev Advocate', type: ContentType.ARTICLE },
  { title: 'Climate deniers are ruining the planet', body: 'Those who deny climate science should be held accountable for the damage their misinformation causes...', authorName: 'EnviroActivist', type: ContentType.COMMENT },
  { title: 'Understanding Quantum Computing', body: 'Quantum bits or qubits can exist in superposition, enabling massively parallel computations...', authorName: 'Physics Prof', type: ContentType.ARTICLE },
  { title: 'Great article, very informative', body: 'Thank you for this well-researched piece. I learned a lot from your clear explanations...', authorName: 'Grateful Reader', type: ContentType.COMMENT },
  { title: 'The Mental Health Crisis Among Youth', body: 'Social media usage is correlated with increased rates of anxiety and depression in teenagers...', authorName: 'Child Psychologist', type: ContentType.ARTICLE },
  { title: 'Stop promoting this garbage', body: 'This platform consistently pushes biased content. I am reporting every single post from this author...', authorName: 'Disgruntled_22', type: ContentType.COMMENT },
  { title: 'How to Learn a New Language Fast', body: 'Immersion combined with spaced repetition software like Anki can drastically accelerate vocabulary acquisition...', authorName: 'Polyglot Pete', type: ContentType.ARTICLE },
  { title: 'Space Exploration: Next 10 Years', body: 'NASA\'s Artemis program aims to return humans to the Moon by 2026, followed by Mars missions in the 2030s...', authorName: 'Astro Writer', type: ContentType.ARTICLE },
  { title: 'Best dev tools of 2024', body: 'From AI code assistants to instant preview environments, the developer experience has never been better...', authorName: 'Dev Blogger', type: ContentType.ARTICLE },
  { title: 'I disagree with this completely', body: 'While I respect the author\'s perspective, the evidence presented fails to support the conclusion drawn...', authorName: 'Critical Thinker', type: ContentType.COMMENT },
  { title: 'Vegan Diet: Myths and Facts', body: 'A well-planned vegan diet can meet all nutritional needs according to major dietetic associations...', authorName: 'Nutritionist Amy', type: ContentType.ARTICLE },
  { title: 'This website is garbage and so are all of you', body: 'Nothing on this platform is worth reading. The editors are useless and should be fired immediately...', authorName: 'HatefulHarry', type: ContentType.COMMENT },
];

export class AdminController {
  constructor(private readonly submissionRepo: ISubmissionRepository) {}

  seed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await Promise.all(
        SEED_SUBMISSIONS.map((s) => this.submissionRepo.create(s))
      );

      getAuditService().log({
        userId: req.user!.id,
        userEmail: req.user!.email,
        userRole: req.user!.role,
        action: AuditAction.ADMIN_SEED,
        success: true,
        newValues: { count: created.length },
        req,
      });

      const { status, body } = ResponseFactory.created(
        { count: created.length },
        `${created.length} test submissions created`
      );
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  };
}
