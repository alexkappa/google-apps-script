import Slack from "./Slack";

/**
 * BugHunter is used to perform the daily administration of the designated bug
 * hunter. A bug hunter is a role given to an engineer assigning first responder
 * duties for the team, typically bug reports or support inquiries.
 *
 * Administration includes notifying a team channel of the daily bug hunter, and
 * assigning them as the only user of a user group.
 */
export default class BugHunter {
  slack: Slack;

  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

  bugHunter: string;
  bugHunterRota: string[];

  today: Date;

  constructor(slack: Slack, today?: Date) {
    this.slack = slack;

    this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    const sheet = SpreadsheetApp.getActiveSheet();
    const sheetData = sheet.getDataRange().getValues();

    this.bugHunter = sheetData[1][13]; // Cell N2: Assignee Slack Member ID
    this.bugHunterRota = [];

    for (var i = 1; i < sheetData.length; i++) {
      let rota = sheetData[i][16]; // Cells Q2:Q11 Next Assignee Next Assignee Name
      if (rota.trim() === "") {
        break;
      }
      this.bugHunterRota.push(rota);
    }

    this.today = today || new Date();
  }

  private isWeekend() {
    var dayOfWeek = this.today.getDay();
    return dayOfWeek === 6 || dayOfWeek === 0; // 6 = Saturday, 0 = Sunday
  }

  notify(channel: string) {
    if (this.isWeekend()) {
      Logger.log(`Don't bother anybody, it's the weekend...`);
      return;
    }

    const response = this.slack.postMessage({
      channel,
      text: `Today's bug hunter is <@${this.bugHunter}>`,
    });

    let text = `The bug hunter rotation continues as follows:\n\n`;
    for (let i = 0; i < this.bugHunterRota.length; i++) {
      text += `• \`@${this.bugHunterRota[i]}\`\n`;
    }
    text += `Check out the <${this.spreadsheet.getUrl()}|Bug Hunters> slide for more info.`;

    this.slack.postMessage({
      channel,
      text,
      thread_ts: response.ts,
    });

    const monitors = [
      "<https://app.datadoghq.com/dashboard/jzn-tb7-7hs/homesprod-photoshoot|Homes Photoshoot>",
      "<https://app.datadoghq.com/dashboard/uvd-2qq-cf6/avalon|Avalon>",
      "<https://app.datadoghq.com/dashboard/ac2-bbm-qam/blue-brainprod-utilities|BlueBrain Utilities>",
      "<https://app.datadoghq.com/dashboard/y3p-293-yzb/blue-brainprod-move-in|BlueBrain Move-in>",
    ];

    let textMonitors = `The following are monitors or dashboards to keep an eye on:\n\n`;
    for (const monitor of monitors) {
      textMonitors += `• ${monitor}\n`;
    }

    textMonitors +=
      `\n` +
      `:warning: Please remember to enable notifications from <#CE1K8M8JD> ` +
      `and prioritize bugs above other work for today.\n`;

    this.slack.postMessage({
      channel,
      text: textMonitors,
      thread_ts: response.ts,
    });
  }

  assign(userGroup: string) {
    this.slack.updateUserGroup({
      userGroup,
      users: [this.bugHunter],
    });
  }
}
