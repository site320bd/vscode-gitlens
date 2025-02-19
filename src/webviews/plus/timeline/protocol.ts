import type { FeatureAccess } from '../../../features';
import type { IpcScope, WebviewState } from '../../protocol';
import { IpcCommand, IpcNotification } from '../../protocol';

export const scope: IpcScope = 'timeline';

export interface State extends WebviewState {
	dataset?: Promise<Commit[]>;
	period: Period;
	title?: string;
	sha?: string;
	uri?: string;
	uriType?: 'folder' | 'file';

	abbreviatedShaLength: number;
	dateFormat: string;
	shortDateFormat: string;
	access: FeatureAccess;
}

export interface Commit {
	sha: string;
	author: string;
	date: string;
	message: string;

	additions: number | undefined;
	deletions: number | undefined;

	sort: number;
}

export type Period = `${number}|${'D' | 'M' | 'Y'}` | 'all';

// COMMANDS

export interface SelectDataPointParams {
	id: string | undefined;
	shift: boolean;
}
export const SelectDataPointCommand = new IpcCommand<SelectDataPointParams>(scope, 'point/open');

export interface UpdatePeriodParams {
	period: Period;
}
export const UpdatePeriodCommand = new IpcCommand<UpdatePeriodParams>(scope, 'period/update');

// NOTIFICATIONS

export interface DidChangeParams {
	state: State;
}
export const DidChangeNotification = new IpcNotification<DidChangeParams>(scope, 'didChange');
