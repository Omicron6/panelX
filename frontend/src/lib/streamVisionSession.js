export async function createStreamVisionSession(config = {}) {
  const apiKey = config.apiKey || process.env.REACT_APP_STREAM_API_KEY;
  const token = config.token || process.env.REACT_APP_STREAM_USER_TOKEN;
  const userId = config.userId || process.env.REACT_APP_STREAM_USER_ID || 'candidate-user';
  const callType = config.callType || process.env.REACT_APP_STREAM_CALL_TYPE || 'default';
  const callId = config.callId || process.env.REACT_APP_STREAM_CALL_ID || 'interview-room';

  if (!apiKey || !token) {
    return {
      enabled: false,
      reason: 'missing_stream_credentials',
      async disconnect() {},
    };
  }

  const { StreamVideoClient } = await import('@stream-io/video-client');

  const client = new StreamVideoClient({
    apiKey,
    user: { id: userId },
    token,
  });

  const call = client.call(callType, callId);
  await call.join({ create: true });

  return {
    enabled: true,
    client,
    call,
    async disconnect() {
      try {
        await call.leave();
      } catch (e) {
        // no-op
      }
      try {
        await client.disconnectUser();
      } catch (e) {
        // no-op
      }
    },
  };
}
