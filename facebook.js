function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  return messageData;
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(serverBaseUrl, imageUrl, recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: serverBaseUrl + imageUrl
        }
      }
    }
  };

  return messageData;
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(serverBaseUrl, gifUrl, recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: serverBaseUrl + gifUrl
        }
      }
    }
  };

  return messageData;
}


/*
 * Send a Audio using the Send API.
 *
 */
function sendAudioMessage(serverBaseUrl, audioURL, recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: serverBaseUrl + audioURL
        }
      }
    }
  };

  return messageData;
}

/*
 * Send a File using the Send API.
 *
 */
function sendFileMessage(serverBaseUrl, fileUrl, recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: serverBaseUrl + fileUrl
        }
      }
    }
  };

  return messageData;
}

/*
 * Send a video using the Send API.
 *
 */
function sendVideoMessage(serverBaseUrl, videoUrl, recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: serverBaseUrl + videoUrl
        }
      }
    }
  };

  return messageData;
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };

  return messageData;
}

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Para una mejor Atención, puedes seleccionar nuestras opciones",
          buttons: [{
            type: "web_url",
            url: "https://www.oculus.com/en-us/rift/",
            title: "Ver Web URL"
          }, {
            type: "postback",
            title: "Trigger Postback",
            payload: "DEVELOPED_DEFINED_PAYLOAD"
          }, {
            type: "phone_number",
            title: "Call Phone Number",
            payload: "+56227909400"
          }]
        }
      }
    }
  };
  return messageData;
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons:[{
            type: "account_link",
            url: "https://gesys-bot-oauth.e-contact.cl/BackendBot/login.jsp?channel_id="+recipientId
          }]
        }
      }
    }
  };

  return messageData;
}


function sendPaymentLink(recipientId, arrButton) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Muchas gracias por tu elección, te invitamos a que accedas al siguiente link para completar tu pago",
          buttons: arrButton
        }
      }
    }
  };

  return messageData;
}

module.exports.sendImageMessage = sendImageMessage;
module.exports.sendGifMessage = sendGifMessage;
module.exports.sendAudioMessage = sendAudioMessage;
module.exports.sendFileMessage = sendFileMessage;
module.exports.sendVideoMessage = sendVideoMessage;
module.exports.sendGenericMessage = sendGenericMessage;
module.exports.sendTextMessage = sendTextMessage;
module.exports.sendButtonMessage = sendButtonMessage;
module.exports.sendAccountLinking = sendAccountLinking;
module.exports.sendPaymentLink = sendPaymentLink;
