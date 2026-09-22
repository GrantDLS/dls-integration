import { proposalCoProposerInvitesUpdatedHandler } from '@dls/eventHandlers/email/proposalCoProposerInvitesUpdatedHandler';
import { proposalSubmittedHandler } from '@dls/eventHandlers/email/proposalSubmittedHandler';
import { ApplicationEvent } from '@core/events/applicationEvents';
import { Event } from '@core/events/event.enum';

export async function EmailHandler(event: ApplicationEvent) {
  const handlers: Partial<
    Record<Event, (event: ApplicationEvent) => Promise<void>>
  > = {
    [Event.PROPOSAL_SUBMITTED]: proposalSubmittedHandler,
    [Event.PROPOSAL_CO_PROPOSER_INVITES_UPDATED]:
      proposalCoProposerInvitesUpdatedHandler,
  };

  if (event.isRejection) return;

  const handler = handlers[event.type];

  if (handler) {
    return await handler(event);
  }

  return;
}



