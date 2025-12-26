# SendZen for WhatsApp (n8n Community Node)

[![npm version](https://img.shields.io/npm/v/n8n-nodes-sendzen.svg?style=flat-square)](https://www.npmjs.com/package/n8n-nodes-sendzen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![n8n](https://img.shields.io/badge/n8n-community-orange?style=flat-square)](https://n8n.io)

This is an n8n community node. It lets you use [SendZen](https://www.sendzen.io/) in your n8n workflows.

**SendZen** is a powerful platform for automating SMS and WhatsApp messages. This node package allows you to integrate SendZen's WhatsApp Cloud API capabilities directly into your n8n automation workflows.

This node is **fully typed** and includes **comprehensive unit tests**, ensuring reliability for production workflows.

---

![SendZen Node in n8n](./assets/screenshot.png)

---

[Installation](#installation) | [Operations](#operations) | [Credentials](#credentials) | [Usage](#usage) | [Resources](#resources) | [Contributing](#contributing)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### 1. SendZen Node (Action)

The SendZen action node supports the following operations:

#### 📤 Send Session Message
Send a free-form text message to a WhatsApp recipient. This operation allows you to send messages within an active 24-hour conversation window.
*   **Features:** URL Previews, E.164 phone validation.

#### 📝 Send Template Message
Send a pre-approved WhatsApp message template. This is required for initiating conversations (business-initiated).
*   **Features:**
    *   **Dynamic Resource Mapper:** Automatically fetches your templates from Meta/SendZen and generates fields for variables (Body `{{1}}`, Header, Buttons).
    *   **Rich Media:** Supports Headers (Image, Video, Document, Audio).
    *   **Interactive:** Supports Call-to-Action and Quick Reply buttons.

#### ✅ Mark as Read
Mark an incoming message as read. This is crucial for analytics and user experience (turning the "ticks" blue).
*   **Auto-Detection:** Automatically extracts Message ID and Phone ID if connected to a SendZen Trigger.

#### 💬 Show Typing Indicator
Display a "Typing..." indicator to the recipient to make the bot feel more human.

### 2. SendZen Trigger Node

The SendZen trigger node allows you to receive incoming WhatsApp messages in real-time via Webhook.
*   **Outputs:** Full message payload (Text, Media, Location, Contacts).
*   **Setup:** Simply copy the Webhook URL from the node and paste it into your SendZen Dashboard.

---

## Credentials

To use the SendZen nodes, you need to authenticate with your SendZen API key.

### Prerequisites

1.  **Sign up for SendZen**: Visit [SendZen](https://www.sendzen.io/) and create an account.
2.  **Get Your API Key**: Navigate to your Dashboard > API Keys.
3.  **WABA Setup**: Ensure your WhatsApp Business Account is connected in SendZen.

### Setting Up in n8n

1.  In the SendZen node, select **Credentials** > **Create New**.
2.  Choose **SendZen API**.
3.  Paste your API Key.
4.  (Optional) Enable "Return Full Response" for debugging.

---

## Compatibility

*   **n8n version:** 1.0.0+ (Tested on 1.89.2+)
*   **Node.js:** >=18.10

---

## Usage Examples

### 🚀 Basic: Send a Session Message
1.  Add a **SendZen** node.
2.  Operation: `Send Session Message`.
3.  WABA Account: Select from the dropdown.
4.  Recipient: `+1234567890`.
5.  Message: "Hello from n8n!".

### 🧩 Advanced: Dynamic Templates
1.  Add a **SendZen** node.
2.  Operation: `Send Template Message`.
3.  Template: Select a template (e.g., `shipping_update`).
4.  **Template Variables**: The node will automatically show fields like:
    *   `Body Variable {{1}}` -> Map to `{{ $json.order_id }}`
    *   `Header Image URL` -> Map to `{{ $json.image_link }}`

### 📥 Handling Incoming Messages
1.  Add the **SendZen Trigger** node.
2.  Connect it to a **Switch** node to check message type (text, image, button reply).
3.  Connect to a **SendZen** node (Operation: `Mark as Read`) to acknowledge receipt.

---

## Resources

*   [SendZen Documentation](https://sendzen.io/docs)
*   [WhatsApp Cloud API Reference](https://developers.facebook.com/docs/whatsapp)
*   [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

---

## Version history

### 1.0.1
*   **Robustness:** Added comprehensive Jest test suite for Triggers, Actions, and Template Builders.
*   **Optimization:** Reduced package size by excluding development files.

### 1.0.0
*   Initial release
*   Support for Session Messages, Templates, Mark as Read, Typing Indicators.
*   Webhook Trigger support.
*   Auto-discovery for WABA Accounts and Templates.

---

## Running Locally

If you want to contribute or modify this node:

1.  **Clone:** `git clone https://github.com/sendzen-io/n8n-nodes-sendzen.git`
2.  **Install:** `pnpm install`
3.  **Build:** `pnpm build`
4.  **Test:** `pnpm test` (Runs the Jest test suite)
5.  **Link:** Follow the [n8n custom node guide](https://docs.n8n.io/integrations/community-nodes/create/) to link `dist` to your local n8n instance.

---

## Contributing

We welcome contributions! Please follow these steps:

1.  Fork the repository.
2.  Create a feature branch.
3.  **Run Tests:** Ensure `pnpm test` passes.
4.  Submit a Pull Request.

**Support:** Contact [milan@sendzen.io](mailto:milan@sendzen.io) or open a GitHub Issue.

---

## License

[MIT](LICENSE.md)
