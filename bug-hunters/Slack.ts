/**
 * A client for interacting with the Slack API.
 */
export default class Slack {
  token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Posts a message to a channel.
   *
   * @param PostMessagePayload payload
   * @returns object
   */
  postMessage(payload: PostMessagePayload) {
    const response = UrlFetchApp.fetch(
      `https://www.slack.com/api/chat.postMessage`,
      {
        method: "post",
        contentType: "application/x-www-form-urlencoded",
        headers: { Authorization: `Bearer ${this.token}` },
        payload: { type: "mrkdwn", ...payload },
      }
    );

    Logger.log(`Web API (chat.postMessage) response: ${response}`);

    return JSON.parse(response.getContentText());
  }

  /**
   * Assigns a user to a user group.
   * @param UpdateUserGroupPayload payload 
   * @returns object
   */
  updateUserGroup(payload: UpdateUserGroupPayload) {
    const response = UrlFetchApp.fetch(
      `https://www.slack.com/api/usergroups.users.update`,
      {
        method: "post",
        contentType: "application/x-www-form-urlencoded",
        headers: { Authorization: `Bearer ${this.token}` },
        payload: { 
          usergroup: payload.userGroup, 
          users: payload.users.join(',') 
        },
      }
    );

    Logger.log(`Web API (usergroups.users.update) response: ${response}`);

    return JSON.parse(response.getContentText());
  }
}

export interface PostMessagePayload {
  channel: string;
  text: string;
  type?: string;
  thread_ts?: string;
}

export interface UpdateUserGroupPayload {
  userGroup: string;
  users: string[];
}

interface LoggerInterface {

}