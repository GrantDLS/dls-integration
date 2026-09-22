import { container } from 'tsyringe';

import { Tokens } from '@core/config/Tokens';
import { ProposalDataSource } from '@core/datasources/ProposalDataSource';
import { UserDataSource } from '@core/datasources/UserDataSource';
import { CallRowObj } from '@core/factory/xlsx/callFaps';
import { RowObj } from '@core/factory/xlsx/fap';
import {
  FapDataRowInput,
  getDataRow as getCoreDataRow,
} from '@core/factory/xlsx/FapDataRow';

type FapRowObj = RowObj & {
  instrumentRequestedTime: number | null | undefined;
};

function nullFieldHelper(
  data: string | number | null | undefined
): string | number {
  return data ?? '<missing>';
}

export async function getDataRow(
  input: FapDataRowInput
): Promise<FapRowObj> {
  const { proposalPk, proposerId, instrumentId } = input;
  const userDataSource = container.resolve<UserDataSource>(
    Tokens.UserDataSource
  );
  const principleInvestigator = proposerId
    ? await userDataSource.getBasicUserInfo(proposerId)
    : null;

  const proposalDataSource = container.resolve<ProposalDataSource>(
    Tokens.ProposalDataSource
  );
  const instrumentRequestedTime = await proposalDataSource.getRequestedTime(
    proposalPk,
    instrumentId
  );

  return {
    ...getCoreDataRow(input),
    piOrg: principleInvestigator?.institution,
    instrumentRequestedTime,
  };
}

export function populateRow(row: RowObj): (string | number)[] {
  return [
    nullFieldHelper(row.propShortCode),
    nullFieldHelper(row.propTitle),
    nullFieldHelper(row.principalInv),
    nullFieldHelper(row.piOrg),
    nullFieldHelper(row.instrName),
    nullFieldHelper(row.instrAvailTime),
    nullFieldHelper(row.techReviewTimeAllocation),
    nullFieldHelper(row.fapTimeAllocation),
    nullFieldHelper(row.propReviewAvgScore),
    nullFieldHelper(row.propFapRankOrder),
    nullFieldHelper(row.inAvailZone),
  ];
}

export function callFapPopulateRow(
  row: CallRowObj & FapRowObj
): (string | number)[] {
  return [
    ...populateRow(row),
    nullFieldHelper(row.fapMeetingDecision),
    nullFieldHelper(row.fapMeetingExComment),
    nullFieldHelper(row.fapMeetingInComment),
    nullFieldHelper(row.instrumentRequestedTime),
  ].concat(row.reviews ? row.reviews.flatMap((review) => review) : []);
}


