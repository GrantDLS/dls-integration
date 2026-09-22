import { ConsoleLogger, setLogger } from '@user-office-software/duo-logger';

import 'reflect-metadata';
import { getSecondsFromAllocationTimeUnits } from '@core/config/base/allocationTimeUnitConverter';
import { configureEnvironment } from './configureEnvironment';
import { Tokens } from '@core/config/Tokens';
import { mapClass, mapValue } from '@core/config/utils';
import { DataAccessUsersAuthorization } from '@core/auth/DataAccessUsersAuthorization';
import { UserAuthorization } from '../auth/UserAuthorization';
import { ProposalAuthorization } from '@core/auth/ProposalAuthorization';
import { VisitAuthorization } from '@core/auth/VisitAuthorization';
import { VisitRegistrationAuthorization } from '@core/auth/VisitRegistrationAuthorization';
import { PostgresAdminDataSourceWithAutoUpgrade } from '@core/datasources/postgres/AdminDataSource';
import PostgresCallDataSource from '@core/datasources/postgres/CallDataSource';
import PostgresCoProposerClaimDataSource from '@core/datasources/postgres/CoProposerClaimDataSource';
import PostgresDataAccessClaimDataSource from '@core/datasources/postgres/DataAccessClaimDataSource';
import PostgresDataAccessUsersDataSource from '@core/datasources/postgres/DataAccessUsersDataSource';
import PostgresEmailTemplateDataSource from '@core/datasources/postgres/EmailTemplateDataSource';
import PostgresEventLogsDataSource from '@core/datasources/postgres/EventLogsDataSource';
import PostgresExperimentDataSource from '@core/datasources/postgres/ExperimentDataSource';
import PostgresExperimentSafetyPdfTemplateDataSource from '@core/datasources/postgres/ExperimentSafetyPdfTemplateDataSource';
import PostgresFapDataSource from '@core/datasources/postgres/FapDataSource';
import PostgresFeedbackDataSource from '@core/datasources/postgres/FeedbackDataSource';
import PostgresFileDataSource from '@core/datasources/postgres/FileDataSource';
import PostgresGenericTemplateDataSource from '@core/datasources/postgres/GenericTemplateDataSource';
import PostgresInstrumentDataSource from '@core/datasources/postgres/InstrumentDataSource';
import PostgresInternalReviewDataSource from '@core/datasources/postgres/InternalReviewDataSource';
import PostgresInviteDataSource from '@core/datasources/postgres/InviteDataSource';
import PostgresPredefinedMessageDataSource from '@core/datasources/postgres/PredefinedMessageDataSource';
import PostgresProposalDataSource from '@core/datasources/postgres/ProposalDataSource';
import PostgresProposalInternalCommentsDataSource from '@core/datasources/postgres/ProposalInternalCommentsDataSource';
import PostgresProposalPdfTemplateDataSource from '@core/datasources/postgres/ProposalPdfTemplateDataSource';
import PostgresQuestionaryDataSource from '@core/datasources/postgres/QuestionaryDataSource';
import PostgresReviewDataSource from '@core/datasources/postgres/ReviewDataSource';
import PostgresRoleClaimDataSource from '@core/datasources/postgres/RoleClaimsDataSource';
import PostgresRoleDataSource from '@core/datasources/postgres/RoleDataSource';
import PostgresSampleDataSource from '@core/datasources/postgres/SampleDataSource';
import PostgresShipmentDataSource from '@core/datasources/postgres/ShipmentDataSource';
import PostgresStatusActionsDataSource from '@core/datasources/postgres/StatusActionsDataSource';
import StatusActionsLogsDataSource from '@core/datasources/postgres/StatusActionsLogsDataSource';
import PostgresStatusDataSource from '@core/datasources/postgres/StatusDataSource';
import PostgresSystemDataSource from '@core/datasources/postgres/SystemDataSource';
import PostgresTagDataSource from '@core/datasources/postgres/TagDataSource';
import PostgresTechniqueDataSource from '@core/datasources/postgres/TechniqueDataSource';
import PostgresTemplateDataSource from '@core/datasources/postgres/TemplateDataSource';
import PostgresUnitDataSource from '@core/datasources/postgres/UnitDataSource';
import PostgresUserDataSource from '@core/datasources/postgres/UserDataSource';
import PostgresVisitDataSource from '@core/datasources/postgres/VisitDataSource';
import PostgresVisitRegistrationClaimDataSource from '@core/datasources/postgres/VisitRegistrationClaimDataSource';
import PostgresWorkflowDataSource from '@core/datasources/postgres/WorkflowDataSource';
import { EmailHandler } from '../eventHandlers/email/EmailHandler';
import createLoggingHandler from '@core/eventHandlers/logging';
import { SMTPMailService } from '@core/eventHandlers/MailService/SMTP/SMTPMailService';
import {
  createListenToRabbitMQHandler,
  createPostToRabbitMQHandler,
} from '@core/eventHandlers/messageBroker';
import { createApplicationEventBus } from '@core/events';
import {
  CallExtraFapDataColumns,
  FapDataColumns,
} from '../factory/xlsx/FapDataColumns';
import {
  callFapPopulateRow,
  getDataRow,
  populateRow,
} from '../factory/xlsx/FapDataRow';
import BasicUserDetailsLoader from '@core/loaders/BasicUserDetailsLoader';
import { SkipAssetRegistrar } from '@core/services/assetRegistrar/skip/SkipAssetRegistrar';

mapClass(Tokens.AdminDataSource, PostgresAdminDataSourceWithAutoUpgrade);
mapClass(Tokens.CoProposerClaimDataSource, PostgresCoProposerClaimDataSource);
mapClass(Tokens.DataAccessClaimDataSource, PostgresDataAccessClaimDataSource);
mapClass(Tokens.DataAccessUsersDataSource, PostgresDataAccessUsersDataSource);
mapClass(Tokens.CallDataSource, PostgresCallDataSource);
mapClass(Tokens.EventLogsDataSource, PostgresEventLogsDataSource);
mapClass(Tokens.FeedbackDataSource, PostgresFeedbackDataSource);
mapClass(Tokens.FileDataSource, PostgresFileDataSource);
mapClass(Tokens.GenericTemplateDataSource, PostgresGenericTemplateDataSource);
mapClass(Tokens.InstrumentDataSource, PostgresInstrumentDataSource);
mapClass(Tokens.InviteDataSource, PostgresInviteDataSource);
mapClass(Tokens.RoleDataSource, PostgresRoleDataSource);
mapClass(Tokens.RoleClaimDataSource, PostgresRoleClaimDataSource);
mapClass(Tokens.InternalReviewDataSource, PostgresInternalReviewDataSource);
mapClass(
  Tokens.ProposalPdfTemplateDataSource,
  PostgresProposalPdfTemplateDataSource
);

mapClass(
  Tokens.ExperimentSafetyPdfTemplateDataSource,
  PostgresExperimentSafetyPdfTemplateDataSource
);
mapClass(Tokens.ProposalDataSource, PostgresProposalDataSource);
mapClass(
  Tokens.ProposalInternalCommentsDataSource,
  PostgresProposalInternalCommentsDataSource
);
mapClass(Tokens.StatusActionsDataSource, PostgresStatusActionsDataSource);
mapClass(Tokens.QuestionaryDataSource, PostgresQuestionaryDataSource);
mapClass(Tokens.ReviewDataSource, PostgresReviewDataSource);
mapClass(Tokens.FapDataSource, PostgresFapDataSource);
mapClass(Tokens.SampleDataSource, PostgresSampleDataSource);
mapClass(Tokens.ShipmentDataSource, PostgresShipmentDataSource);
mapClass(Tokens.SystemDataSource, PostgresSystemDataSource);
mapClass(Tokens.TemplateDataSource, PostgresTemplateDataSource);
mapClass(Tokens.UnitDataSource, PostgresUnitDataSource);
mapClass(Tokens.UserDataSource, PostgresUserDataSource);
mapClass(Tokens.VisitDataSource, PostgresVisitDataSource);
mapClass(
  Tokens.VisitRegistrationClaimDataSource,
  PostgresVisitRegistrationClaimDataSource
);
mapClass(Tokens.VisitAuthorization, VisitAuthorization);
mapClass(Tokens.VisitRegistrationAuthorization, VisitRegistrationAuthorization);
mapClass(Tokens.TechniqueDataSource, PostgresTechniqueDataSource);
mapClass(
  Tokens.PredefinedMessageDataSource,
  PostgresPredefinedMessageDataSource
);
mapClass(Tokens.StatusActionsLogsDataSource, StatusActionsLogsDataSource);
mapClass(Tokens.WorkflowDataSource, PostgresWorkflowDataSource);
mapClass(Tokens.StatusDataSource, PostgresStatusDataSource);
mapClass(Tokens.ExperimentDataSource, PostgresExperimentDataSource);
mapClass(Tokens.TagDataSource, PostgresTagDataSource);

mapClass(Tokens.UserAuthorization, UserAuthorization);
mapClass(Tokens.ProposalAuthorization, ProposalAuthorization);
mapClass(Tokens.DataAccessUsersAuthorization, DataAccessUsersAuthorization);

mapClass(Tokens.AssetRegistrar, SkipAssetRegistrar);

mapClass(Tokens.MailService, SMTPMailService);

mapValue(Tokens.FapDataColumns, FapDataColumns);
mapValue(Tokens.CallExtraFapDataColumns, CallExtraFapDataColumns);
mapValue(Tokens.FapDataRow, getDataRow);
mapValue(Tokens.PopulateRow, populateRow);
mapValue(Tokens.PopulateCallRow, callFapPopulateRow);

mapValue(Tokens.EmailEventHandler, EmailHandler);
mapClass(Tokens.EmailTemplateDataSource, PostgresEmailTemplateDataSource);

mapValue(Tokens.PostToMessageQueue, createPostToRabbitMQHandler());
mapValue(Tokens.LoggingHandler, createLoggingHandler());
mapValue(Tokens.EventBus, createApplicationEventBus());
mapValue(Tokens.ListenToMessageQueue, createListenToRabbitMQHandler());

mapValue(Tokens.ConfigureEnvironment, configureEnvironment);
mapValue(Tokens.ConfigureLogger, () => setLogger(new ConsoleLogger()));

mapClass(Tokens.BasicUserDetailsLoader, BasicUserDetailsLoader);
mapValue(Tokens.ConvertAllocationTimeUnits, getSecondsFromAllocationTimeUnits);

