'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const config = require('config');
var facebook = require('./facebook');
const queryString = require('querystring');
var webpage = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<script src=\"https://button.glitch.me/button.js\" data-style=\"glitch\"></script><div class=\"glitchButton\" style=\"position:fixed;top:20px;right:20px;\"></div></body></html>";

/****************************************
**************Constants******************
*****************************************/
// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  process.env.MESSENGER_VALIDATION_TOKEN :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  process.env.MESSENGER_PAGE_ACCESS_TOKEN :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL) ?
  process.env.SERVER_URL :
  config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

const SERVER_BACKEND_URL = (config.get('backendURL')) ?
  config.get('backendURL') :
  'http://localhost:8001';

// URL where the app is running (include protocol). Used to use API Graph of Facebook
//  Retrieve User Information as example
const SERVER_APIGRAPH_URL = (process.env.SERVER_APIGRAPH_URL) ?
  (process.env.SERVER_APIGRAPH_URL) :
  config.get('serverAPIGraphURL');

const AUTHENTICATION_BACKEND = (config.get('authenticationBackend')) ?
  config.get('authenticationBackend') :
  'andre:Aa123456';

const CHANNEL_NAME = "Facebook";
const MESSAGE_TYPE_IMAGE = 'image';
const MESSAGE_TYPE_TEXT = 'text';
const MESSAGE_TYPE_DOCUMENT = 'document';

//Express server.
let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Message processing
app.post('/webhook', function(req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          console.log("optin webhook");
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          console.log("message webhook");
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          console.log("delivery webhook");
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          console.log("postback webhook");
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          console.log("read webhook");
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          console.log("account_linking webhook");
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  console.log("Received message for user %d and page %d at %d with message: %s",
    senderID, recipientID, timeOfMessage, messageText);

  if (isEcho) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s",
      messageId, appId, metadata);
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
    var readAsMessage = false;
    /*switch (quickReplyPayload){
    	case 'SOAP_COTIZAR_SI':
    		sendQuestionVehiculeType(senderID);
    		break;
    	default:
    		readAsMessage = true;
    		break;
    }*/

    //callSendAPI(sendTextMessage(senderID, "Quick reply tapped"));
    //if (!readAsMessage) return;
  }

  if (messageText) {
    console.log("messageText receive");
    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {
      case 'image':
        callSendAPI(facebook.sendImageMessage(SERVER_URL, "/assets/rift.png", senderID));
        break;

      case 'gif':
        callSendAPI(facebook.sendGifMessage(SERVER_URL, "/assets/instagram_logo.gif", senderID));
        break;

      case 'audio':
        callSendAPI(facebook.sendAudioMessage(SERVER_URL, "/assets/sample.mp3", senderID));
        break;

      case 'video':
        callSendAPI(facebook.sendVideoMessage(SERVER_URL, "/assets/allofus480.mov", senderID));
        break;

      case 'file':
        callSendAPI(facebook.sendFileMessage(SERVER_URL, "/assets/test.txt", senderID));
        break;

      case 'button':
        callSendAPI(facebook.sendButtonMessage(senderID));
        break;

      case 'generic':
        callSendAPI(facebook.sendGenericMessage(senderID));
        break;

      case 'account linking':
        callSendAPI(facebook.sendAccountLinking(senderID));
        break;

      default:
        var msg = {
          "type": MESSAGE_TYPE_TEXT,
          "text": messageText,
          "id": senderID,
        };
        sendToBot(msg);
    } //end switch (messageText)
  } else if (messageAttachments) {
    var jsonAttachments = JSON.stringify(message);
    console.log("Received message with attachments: %s",
      jsonAttachments);

    for (var attach in messageAttachments) {
      var jsonAttach = messageAttachments[attach];
      var strAttach = JSON.stringify(jsonAttach);
      console.log("Attach received: %s", strAttach);

      var msg = {
        "type": jsonAttach.type,
        "text": jsonAttach.payload.url,
        "id": senderID,
      };

      sendToBot(msg);
    }

  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  callSendAPI(facebook.sendTextMessage(senderID, "Postback called"));
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: process.env.PAGE_ACCESS_TOKEN
    },
    method: 'POST',
    json: messageData

  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam,
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  callSendAPI(facebook.sendTextMessage(senderID, "Authentication successful"));
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s",
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  if (payload == 'ECONTACT_MAKE_C2C') {
    /*var userInfo = getUserFromMemory(senderID);
	  if (userInfo.phone == ""){
		updateUserProfile(senderID, "askForPhone", true);
		callSendAPI(facebook.sendTextMessage(senderID, "Perfecto, para una mejor información, por favor escribe tu número de contacto usando el siguiente formato: tel:12345678 y te llamaremos lo antes posible."));
	  }else{
		requestInfoC2C(userInfo);
	  }*/

  } else if (payload == 'PROCESS_ASSURANCE_TYPE_BNP' || payload == 'PROCESS_ASSURANCE_TYPE_BCI') {
    //callSendAPI(facebook.sendTextMessage(senderID, "Muchas gracias por tu elección, te invitamos a que accedas al siguiente link para completar tu pago: http://www.segurosfalabella.cl/web/seguros/home"));
    var arrButtons = [{
      type: "web_url",
      url: "http://www.segurosfalabella.cl/web/seguros/home",
      title: "Pagar",
      webview_height_ratio: "full"
    }];
    //sendPaymentLink(senderID, arrButtons);
  } else {
    var msg = {
      "type": MESSAGE_TYPE_TEXT,
      "text": payload,
      "id": senderID,
    };
    sendToBot(msg);
  }
}

function sendToBot(msg) {
  var userInfo = {
    "id": msg.id,
    "first_name": "",
    "last_name": "",
    "locale": "",
    "timezone": "",
    "gender": "",
    "phone": "",
    "askForPhone": false,
    "text": msg.text,
    "type": msg.type
  };
  getUserProfile(userInfo);
}

/*
LOGICA
	//1. VERIFICAR SI EL USUARIO EXISTE O NO EN EL BACKEND
	//2. SI EXISTE, VEERIFICAR SI TIENE UNA CONVERSATION ACTIVA
		//2.1 EN CASO DE TENER, SE PROSIGUE CON LA CONVERSACION
		//2.2 EN CASO DE NO TENER, SE CREA UNA CONVERSACION EN WATSON

	//3. SI NO EXISTE, SE CREA EN EL BACKEND Y SE CREA NUEVA CONVERSACION EN WATSON
*/
function getUserProfile(msg) {
  var senderID = msg.id;
  console.log("getUserProfile %s", senderID);
  var user = null;

  var data = {
    "channel_name": CHANNEL_NAME,
    "channel_code": senderID
  }

  var clientBackend = {}

  request.post({
    uri: SERVER_BACKEND_URL + '/clientchannels/',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + new Buffer(AUTHENTICATION_BACKEND).toString('base64')
    },
    body: queryString.stringify(data)
  }, function(error, response, body) {

    clientBackend = {};

    if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
      console.log("getUserProfile " + senderID + " is registered on ContactBot.");
      var aux = JSON.parse(body);
      clientBackend = aux.client;

      //User's Info already saved, goes to Process Conversation
      processConversation(msg);

    } else if (!error && (response.statusCode == 204)) {
      console.log("getUserProfile " + senderID + " is not register on ContactBot.");
      console.log("Gets Info of User on Facebook and then goes to Process Conversation");
      //Gets Info of User and then goes to Process Conversation
      facebookGetUserProfile(msg);
    } else {
      console.log("getUserProfile Error in response %s", JSON.stringify(response));
    }
  });
}

function facebookGetUserProfile(msg) {
  console.log("facebookGetUserProfile %s", msg.id);

  var userInfo = {
    "id": msg.id,
    "first_name": "",
    "last_name": "",
    "locale": "",
    "timezone": "",
    "gender": "",
    "phone": "",
    "askForPhone": false,
    "text": msg.text,
    "senderID": msg.id,
  };

  request({
    url: SERVER_APIGRAPH_URL + msg.id + '?fields=first_name,last_name,locale,timezone,gender&access_token=' + PAGE_ACCESS_TOKEN,
    method: 'GET'
  }, function(error, response, body) {
    if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
      var aux = JSON.parse(body);
      console.log("facebookGetUserProfile aux %s", JSON.stringify(aux));
      if (aux != null) {
        userInfo = {
          "id": msg.id,
          "first_name": aux.first_name,
          "last_name": aux.last_name,
          "locale": aux.locale,
          "timezone": aux.timezone,
          "gender": aux.gender,
          "phone": "",
          "askForPhone": false,
          "text": msg.text,
          "senderID": msg.id,
        }
      }
      console.log("facebookGetUserProfile Add Info of User from Facebook on ContactBot");
      addUserProfile(userInfo);
    } else {
      console.log("facebookGetUserProfile Ha ocurrido un error %s", JSON.stringify(response));
    }
  });

}

function addUserProfile(msg) {
  var senderID = msg.id;
  console.log("addUserProfile %s", senderID);
  var clientBackend = {}
  var userInfo = {
    "firstname": msg.first_name,
    "lastname": msg.last_name,
    "email": "",
    "phonenumber": "",
    "channel_name": CHANNEL_NAME,
    "channel_code": msg.id
  }

  request.post({
    uri: SERVER_BACKEND_URL + '/clients/',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + new Buffer(AUTHENTICATION_BACKEND).toString('base64')
    },
    body: queryString.stringify(userInfo)
  }, function(error, response, body) {
    if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
      console.log("addUserProfile " + senderID + " register successfully.");
      clientBackend = JSON.parse(body);
      console.log("addUserProfile: User saved successfully and then goes to Process Conversation");
      //User saved successfully and then goes to Process Conversation
      processConversation(msg);
    } else if (!error && (response.statusCode == 400)) {
      console.log("addUserProfile: " + senderID + " could not be register.");
    } else {
      console.log("addUserProfile: Error in response %s", JSON.stringify(response));
    }
  });
}

function processConversation(msg) {
  var userInfo = {
    "message": msg.text,
    "channel": CHANNEL_NAME,
    "client": msg.id,
    "type": msg.type
  }
  requestProcessConversation(userInfo);
}

function requestProcessConversation(userInfo) {
  request.post({
    uri: SERVER_BACKEND_URL + '/conversations/process/',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Authorization': 'Basic ' + new Buffer(AUTHENTICATION_BACKEND).toString('base64')
    },
    body: JSON.stringify(userInfo)
  }, function(error, response, body) {
    if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
      var bodyResponse = JSON.parse(body);
      console.log("requestProcessConversation post response: -> conversation_id " + bodyResponse.conversation_id);
      console.log("requestProcessConversation post response: -> ouput.text " + bodyResponse.output.text);
      console.log("requestProcessConversation post response: -> bodyResponse " + JSON.stringify(bodyResponse))
      if ((bodyResponse.output.text[0] != null) && (bodyResponse.output.text[0] != '[')) {
        console.log("requestProcessConversation goes to classifyResponse");
        classifyResponse(userInfo, bodyResponse);
      } else {
        console.log("requestProcessConversation: El mensaje recibido es [, por eso no se debe enviar al chat");
      }
    } else if (!error && (response.statusCode == 400 || response.statusCode == 204)) {
      console.log("requestProcessConversation ERROR post response: There is not a Current Conversation");
    } else {
      console.log("requestProcessConversation ERROR NO HANDLER post response: Current Conversation could not be loaded %s", JSON.stringify(response));
    }
  });
}

/*
 *****************************************************************************
 * This method receive a info about message and body Response from contact-bot
 * and return json value with response to the client
 * messageData:  Info about client, it is used to get SenderId
 * body: Response from backed, it could has menu options and other values.
 *****************************************************************************
 */
function classifyResponse(userInfo, body) {

  var senderID = userInfo.client;
  console.log("classifyResponse -> Client: " + senderID);

  var type = JSON.stringify(body.output.type);

  var hasMenu = false;
  var menu = [];
  var menuType = 0;
  var options = body.output.options;
  var payload = {};
  //Checking if has Menu
  console.log("classifyResponse -> Type: " + type);
  console.log("classifyResponse -> Options: " + options.length);
  for (var option in options) {
    hasMenu = true;
    console.log("classifyResponse -> Menu Options: " + body.output.options[option].text);

    //if (type == "\"MENU\""){
    if (options.length > 2) {
      //Elements in Generic (Buttons and Image

      var message = body.output.options[option].text;
      var image = SERVER_URL + "/assets/touch.png";

      if (message == "Solicitar Crédito Hipotecario") {
        image = SERVER_URL + "/assets/credito_hipotecario.png";
      } else if (message == "Consultar Saldo") {
        image = SERVER_URL + "/assets/consultar_saldo.png";
      } else if (message == "Activación de Productos") {
        image = SERVER_URL + "/assets/activar_productos.png";
      } else if (message == "Bloqueo de Productos") {
        image = SERVER_URL + "/assets/bloquear_productos.png";
      } else if (message == "Tarjeta de Débito") {
        image = SERVER_URL + "/assets/tarjeta_debito2.png";
      } else if (message == "Tarjeta de Crédito MasterCard") {
        image = SERVER_URL + "/assets/tarjeta_credito2.png";
      } else if (message == "Tarjeta de debito Visa") {
        image = SERVER_URL + "/assets/tarjeta_debito2.png";
      } else if (message == "Tarjeta de Crédito") {
        image = SERVER_URL + "/assets/tarjeta_credito2.png";
      } else if (message == "Cuenta Corriente") {
        image = SERVER_URL + "/assets/cuenta_corriente.png";
      } else if (message == "Cheque") {
        image = SERVER_URL + "/assets/cheque.png";
      }

      var element = {
        title: message,
        image_url: image,
        buttons: [{
          type: "postback",
          title: "Más info.",
          payload: message,
        }],
      };

      menu.push(element);
    } else {
      menuType = 1;
      //Elements in QuickReplies
      var element = {
        "content_type": "text",
        "title": body.output.options[option].text,
        "payload": body.output.options[option].text
      };

      menu.push(element);
    }
  }

  //Sending Menu if exists
  if (hasMenu) {
    if (menuType == 0) {
      //Sending Individual Message
      var arrMsg = body.output.text;
      for (var i = 0; i < arrMsg.length; i++) {
        callSendAPI(facebook.sendTextMessage(userInfo.client, arrMsg[i]));
      }
      sendMenuGenericMessage(userInfo.client, menu);
    } else {
      //Sending Individual Message
      var arrMsg = body.output.text;
      for (var i = 0; i < arrMsg.length; i++) {
        sendMenuQuickReplyMessage(userInfo.client, arrMsg[i], menu);
      }
    }
  } else {
    //Sending Individual Message
    var arrMsg = body.output.text;
    for (var i = 0; i < arrMsg.length; i++) {
      callSendAPI(facebook.sendTextMessage(userInfo.client, arrMsg[i]));
    }
  }
}

function sendMenuGenericMessage(recipientId, menu) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: menu
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendMenuQuickReplyMessage(recipientId, text, menu) {

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: text,
      metadata: "DEVELOPER_DEFINED_METADATA",
      quick_replies: menu
    }
  };

  callSendAPI(messageData);
}



/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

// Display the web page
app.get('/', function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.write(webpage);
  res.end();
});

// Set Express to listen out for HTTP requests
var server = app.listen(5000, function() {
  console.log("Listening on port %s", server.address().port);
});
