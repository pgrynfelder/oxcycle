// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
"use strict";

const functions = require("firebase-functions");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Card, Suggestion } = require("dialogflow-fulfillment");

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(A) {
  return A[randomInt(0, A.length - 1)];
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log(
      "Dialogflow Request headers: " + JSON.stringify(request.headers)
    );
    console.log("Dialogflow Request body: " + JSON.stringify(request.body));

    function recycleIntent(agent) {
      const { object, material } = agent.parameters;

      if (material == "plastic") {
        agent.add(`Oh, plastic. Does it stretch?`);
        agent.setContext({
          name: "plasticContext",
          lifespan: 1,
        });
      } else if (material == "glass") {
        agent.add(
          `Oh nice. Is it some fancy shaped perhaps tempered or lead glass?`
        );
        agent.setContext({
          name: "glassContext",
          lifespan: 1,
        });
      } else if (material == "paper") {
        agent.add(`Is it shiny, metallic or glued?`);
        agent.setContext({
          name: "paperContext",
          lifespan: 1,
        });
      }
    }

    function recyclable(agent) {
      agent.clearOutgoingContexts();
      agent.add(
        "You can safely recycle it. Remember to rinse food leftovers if it has any on it."
      );
    }

    function nonRecyclable(agent) {
      const NON_RECYCLABLE = ["It's not recyclable 🥺", ":(((((("];
      agent.clearOutgoingContexts();
      agent.add(randomElement(NON_RECYCLABLE));
    }

    function foodWaste(agent) {
      agent.clearOutgoingContexts();
      agent.add("Throw it in the food bin");
    }

    function plasticNoStretchIntent(agent) {
      agent.add("Does it maintain shape when scrunched?");
    }

    // // Uncomment and edit to make your own intent handler
    // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
    // // below to get this function to be run when a Dialogflow intent is matched
    // function yourFunctionHandler(agent) {
    //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
    //   agent.add(new Card({
    //       title: `Title: this is a card title`,
    //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
    //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
    //       buttonText: 'This is a button',
    //       buttonUrl: 'https://assistant.google.com/'
    //     })
    //   );
    //   agent.add(new Suggestion(`Quick Reply`));
    //   agent.add(new Suggestion(`Suggestion`));
    //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
    // }

    let intentMap = new Map();
    intentMap.set("recycleIntent", recycleIntent);
    intentMap.set("plasticYesStretchIntent", recyclable);
    intentMap.set("plasticNoStretchIntent", plasticNoStretchIntent);
    intentMap.set("glassYesFancyIntent", nonRecyclable);
    intentMap.set("glassNoFancyIntent", recyclable);
    intentMap.set("plasticYesScrunchIntent", recyclable);
    intentMap.set("plasticNoScrunchIntent", nonRecyclable);
    intentMap.set("paperYesShinyIntent", nonRecyclable);
    intentMap.set("paperNoShinyIntent", recyclable);

    agent.handleRequest(intentMap);
  }
);
