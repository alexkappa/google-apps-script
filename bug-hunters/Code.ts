import Slack from "./Slack";
import BugHunter from "./BugHunter";

const { 
  SLACK_OAUTH_TOKEN, 
  SLACK_CHANNEL, 
  SLACK_USER_GROUP 
} = PropertiesService.getScriptProperties().getProperties();

function notifyBugHunter() {
  const slack = new Slack(SLACK_OAUTH_TOKEN);
  const bugHunter = new BugHunter(slack);
  bugHunter.notify(SLACK_CHANNEL);
  bugHunter.assign(SLACK_USER_GROUP);
}
