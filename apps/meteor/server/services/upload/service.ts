import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IUpload, IUser, MessageAttachment } from '@rocket.chat/core-typings';
import type { ISendFileLivechatMessageParams, ISendFileMessageParams, IUploadFileParams, IUploadService } from '@rocket.chat/core-services';

import { FileUpload } from '../../../app/file-upload/server';
import { sendFileLivechatMessage } from '../../../app/livechat/server/methods/sendFileLivechatMessage';
import { parseFileIntoMessageAttachments, sendFileMessage } from '../../../app/file-upload/server/methods/sendFileMessage';

export class UploadService extends ServiceClassInternal implements IUploadService {
	protected name = 'upload';

	async uploadFile({ buffer, details }: IUploadFileParams): Promise<IUpload> {
		const fileStore = FileUpload.getStore('Uploads');
		return fileStore.insert(details, buffer);
	}

	async sendFileMessage({ roomId, file, userId, message }: ISendFileMessageParams): Promise<boolean | undefined> {
		return sendFileMessage(userId, { roomId, file, msgData: message });
	}

	async sendFileLivechatMessage({ roomId, visitorToken, file, message }: ISendFileLivechatMessageParams): Promise<boolean> {
		return sendFileLivechatMessage({ roomId, visitorToken, file, msgData: message });
	}

	async getFileBuffer({ file }: { file: IUpload }): Promise<Buffer> {
		const buffer = await FileUpload.getBuffer(file);

		if (!(buffer instanceof Buffer)) {
			throw new Error('Unknown error');
		}
		return buffer;
	}

	async extractMetadata(file: IUpload): Promise<{ height?: number; width?: number; format?: string }> {
		return FileUpload.extractMetadata(file);
	}

	async parseFileIntoMessageAttachments(
		file: Partial<IUpload>,
		roomId: string,
		user: IUser,
	): Promise<{
		files: {
			_id: string;
			name: string | undefined;
			type: string | undefined;
		}[];
		attachments: MessageAttachment[];
	}> {
		return parseFileIntoMessageAttachments(file, roomId, user);
	}
}
