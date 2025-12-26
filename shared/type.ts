export interface WABAResponseList {
	message: string;
	data: {
		projects: {
			id: number;
			project_name: string;
			client_identifier: string;
			wabas: {
				id: number;
				waba_id: string;
				waba_business_name: string;
				phone_number_id: string;
				phone_number: string;
				number_status: string;
				setup_mode: string;
				mm_lite_api_status: string;
				phone_number_type: string;
				waba_onboard_stage: string;
			}[];
		}[];
	};
}

export interface SendTextMessageRequest {
	from: string;
	to: string;
	type: 'text';
	text: {
		body: string;
		preview_url?: boolean;
	};
}

export type SendzenAPIErroResponse = {
	message: string;
	error: {
		code: string;
		details: string;
	};
};
