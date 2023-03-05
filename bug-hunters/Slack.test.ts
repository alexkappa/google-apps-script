import Slack from "./Slack";

// @ts-ignore
global.Logger = {
  log: (data: any) => {
    return this;
  },
};

const fetchMock = jest.fn().mockImplementation((url, options) => ({
  getContentText: () => JSON.stringify({ ts: "123.456", ...options.payload }),
  getHeaders: () => options.headers,
}));

// @ts-ignore
global.UrlFetchApp = {
  // @ts-ignore
  fetch: fetchMock,
};

const slack = new Slack("token-xxx");

describe("Slack", () => {
  test("postMessage()", () => {
    const response = slack.postMessage({
      channel: "channel",
      text: "Sending a message",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const fetchResultValue = fetchMock.mock.results[0].value;
    expect(fetchResultValue.getHeaders()).toMatchObject({"Authorization": "Bearer token-xxx"});

    expect(response.channel).toBe("channel");
    expect(response.text).toBe("Sending a message");
    expect(response.ts).toBe("123.456");
    expect(response.type).toBe("mrkdwn"); // type: "mrkdwn" is computed by postMessage
  });
});
