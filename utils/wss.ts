class WebsocketStream extends (Stream)(WebsocketBase) {
  wsURL: string;
  combinedStreams: boolean;

  constructor (options = {}) {
    super(options);
    this.wsURL = options.wsURL || 'wss://stream.binance.com:9443';
    this.combinedStreams = options.combinedStreams || false;
  }

  _prepareURL (stream: string) {
    let url = `${this.wsURL}/ws/${stream}`;
    if (this.combinedStreams) {
      url = `${this.wsURL}/stream?streams=${stream}`;
    }
    return url;
  }

  subscribe (stream: string | string[]) {
    if (!this.isConnected()) {
      const url = this._prepareURL(stream);
      this.initConnect(url);
    } else {
      if (!Array.isArray(stream)) {
        stream = [stream];
      }
      const payload = {
        method: 'SUBSCRIBE',
        params: stream,
        id: Date.now()
      };

      this.logger.info('SUBSCRIBE', payload);
      this.send(JSON.stringify(payload));
    }
  }
}
