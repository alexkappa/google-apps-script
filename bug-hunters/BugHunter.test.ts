import BugHunter from "./BugHunter";
import Slack, { PostMessagePayload } from "./Slack";

// @ts-ignore
global.Logger = {
  log: (data: any) => {
    return this;
  },
};

// A stubbed implementation of the global SpreadsheetApp so that we can work
// with Google App Script constructs without invoking their actual API.
// @ts-ignore
global.SpreadsheetApp = {
  // @ts-ignore
  getActiveSpreadsheet: () => ({
    getUrl: (): string => "https://docs.google.com/spreadsheets/d/xxx/edit",
  }),
  // @ts-ignore
  getActiveSheet: () => ({
    // @ts-ignore
    getDataRange: () => ({
      getValues: () => values,
    }),
  }),
};

const values = [
  [],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "U000000000X", 0, 0, "Bob"],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "           ", 0, 0, "Alice"],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "           ", 0, 0, "Charlie"],
];

describe("BugHunter", () => {
  // Mock the slack.postMessage function so as to not invoke the Slack API when
  // testing. See: https://api.slack.com/methods/chat.postMessage#examples
  const postMessageMock = jest
    .spyOn(Slack.prototype, "postMessage")
    .mockImplementation((payload: PostMessagePayload) => {
      return {
        ok: true,
        channel: payload.channel,
        ts: "123.456",
        message: { text: payload.text },
      };
    });

  beforeEach(() => {
    postMessageMock.mockClear();
  });

  test("notify() on a workday", () => {
    const slack = new Slack("token");
    const workday = new Date("2023-03-03T09:00:00");
    const bugHunter = new BugHunter(slack, workday);

    bugHunter.notify("channel");

    console.log(postMessageMock.mock.results.map((v) => v.value.message));

    expect(postMessageMock.mock.results[0].value.ok).toBe(true);
    expect(postMessageMock.mock.results[0].value.channel).toBe("channel");
    expect(postMessageMock.mock.results[0].value.ts).toBe("123.456");
    expect(postMessageMock.mock.results[0].value.message.text).toContain(
      "<@U000000000X>"
    );

    expect(postMessageMock.mock.results[1].value.ok).toBe(true);
    expect(postMessageMock.mock.results[1].value.channel).toBe("channel");
    expect(postMessageMock.mock.results[1].value.message.text).toContain(
      "`@Bob`"
    );
    expect(postMessageMock.mock.results[1].value.message.text).toContain(
      "`@Alice`"
    );
    expect(postMessageMock.mock.results[1].value.message.text).toContain(
      "`@Charlie`"
    );
  });

  test("notify() on a weekend", () => {
    const slack = new Slack("token");
    const weekend = new Date("2023-03-04T09:00:00");
    const bugHunter = new BugHunter(slack, weekend);

    bugHunter.notify("channel");

    expect(postMessageMock).toHaveBeenCalledTimes(0);
  });
});
