const { SendZen } = require('./dist/nodes/SendZen/SendZen.node');
const { SendZenTrigger } = require('./dist/nodes/SendZen/SendZenTrigger.node');

module.exports = {
  nodes: [
    SendZen,
		SendZenTrigger,
  ],
};

