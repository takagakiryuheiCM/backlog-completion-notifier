/**
 * Slack Block Kit の型定義
 */

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: SlackBlockElement[];
  accessory?: SlackBlockElement;
  block_id?: string;
}

export interface SlackBlockElement {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  action_id?: string;
  value?: string;
  style?: "primary" | "danger";
}

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
}
