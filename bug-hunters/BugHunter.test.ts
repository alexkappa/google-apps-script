import BugHunter, {
  SpreadsheetAppInterface,
  SpreadsheetInterface,
  SheetInterface,
  RangeInterface,
} from "./BugHunter";
import Slack, { PostMessagePayload } from "./Slack";

// A stubbed implementation of the global SpreadsheetApp so that we can work
// with Google App Script constructs without
const app: SpreadsheetAppInterface = {
  getActiveSpreadsheet(): SpreadsheetInterface {
    return {
      getUrl(): string {
        return "https://docs.google.com/spreadsheets/d/xxx/edit";
      },
    };
  },
  getActiveSheet(): SheetInterface {
    return {
      getDataRange(): RangeInterface {
        return {
          getValues(): any[][] {
            return values;
          },
        };
      },
    };
  },
};

const values = [
  [],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "U000000000X", 0, 0, "Bob"],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "           ", 0, 0, "Alice"],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "           ", 0, 0, "Charlie"],
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
    const bugHunter = new BugHunter(app, slack, workday);

    bugHunter.notify("channel");

    expect(postMessageMock).toHaveBeenCalledTimes(2);
    
    expect(postMessageMock.mock.results[0].value.ok).toBe(true);
    expect(postMessageMock.mock.results[0].value.channel).toBe("channel");
    expect(postMessageMock.mock.results[0].value.ts).toBe("123.456");
    expect(postMessageMock.mock.results[0].value.message.text).toContain("<@U000000000X>");
    
    expect(postMessageMock.mock.results[1].value.ok).toBe(true);
    expect(postMessageMock.mock.results[1].value.channel).toBe("channel");
    expect(postMessageMock.mock.results[1].value.message.text).toContain("`@Bob`");
    expect(postMessageMock.mock.results[1].value.message.text).toContain("`@Alice`");
    expect(postMessageMock.mock.results[1].value.message.text).toContain("`@Charlie`");
    
  });

  test("notify() on a weekend", () => {
    const slack = new Slack("token");
    const weekend = new Date("2023-03-04T09:00:00");
    const bugHunter = new BugHunter(app, slack, weekend);

    bugHunter.notify("channel");

    expect(postMessageMock).toHaveBeenCalledTimes(0);
  });
});
