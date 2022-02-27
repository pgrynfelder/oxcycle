// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
"use strict";

const functions = require("firebase-functions");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Card, Suggestion } = require("dialogflow-fulfillment");

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

const NON_RECYCLABLE = [
  "It's not recyclable :(",
  "Please do not recycle this 💔💔",
  "❌ Please do not recycle this item",
  "This item is not recyclable 🚫",
  "Don't recycle ⛔️!",
  "Please put this in a non-recyclable bin"
];

const RECYCLABLE = [
  "Okay, it is recyclable! ",
  "You can recycle it! ✅✅✅",
  "I believe it can be recycled",
  "You can recycle this 🅿️",
  "Please recycle this!",
  "Yup, you can recycle this",
  "Put this in the recycle bin",
];

const MATERIAL_FOLLOWUP = [
  "Could you specify the material?",
  "What is it made of?",
  "What material is it made of?",
  "Please specify the material",
  "Could you please specify the material?",
];

const GLASS_Q = [
  "Oh nice. Is it some fancy shaped perhaps tempered or lead glass?",
  "Is the glass tempered or lead?",
  "Ok, is the glass tempered or leaded?",
  "Could you be more specific about the type, is it fancy or tempered or lead?",
  "Is it a fancy or lead or a tempered glass",
];

const PLASTIC_NOSTRETCH = [
  "Try scrunching it, does it maintain its shape?",
  "When you scrunch it, does it maintain its shape?",
  "What happens when you scrunch it? Does its shape remain the shape?",
  "Does its shape remain the same when you scrunch it?",
];

const PLASTIC_STRETCH = [
  "Oh it's plastic, can you stretch it?",
  "Can you stretch it?",
  "When you stretch it, does its shape change?",
  "Can you stretch your item?",
];

const FOOD = [
  "Throw it in the food bin!",
  "Please throw in a nearby food bin",
  "You should throw this in a food bin",
  "Please find a food bin and throw this in it",
];

const FAILED = [
  "Sorry, I can't help you 😢. Try checking on the packaging.",
  "I'm so sorry I can't help you with this 😭, refer to the Oxford recycling web page.",
  "Sorry, I don't know how to answer this, please check the packaging on the item or the Oxford recycling page.",
  "I don't know how to answer this, try checking the packaging.",
];
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

      if (object == "#1") {
        return recyclable(agent);
      } else if (object == "#2") {
        return nonRecyclable(agent);
      } else if (object == "#3") {
        return foodWaste(agent);
      }

      if (!object && !material)
        return agent.add(randomElement(MATERIAL_FOLLOWUP));

      if (material == "plastic") {
        agent.add(randomElement(PLASTIC_STRETCH));
        agent.setContext({
          name: "plasticContext",
          lifespan: 1,
        });
      } else if (material == "glass") {
        agent.add(randomElement(GLASS_Q));
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
      } else if (material == "food") {
        foodWaste(agent);
      } else if (material == "wood") {
        nonRecyclable(agent);
      } else {
        failed(agent);
      }
    }

    function recyclable(agent) {
      agent.clearOutgoingContexts();
      agent.add(randomElement(RECYCLABLE));
    }

    function nonRecyclable(agent) {
      agent.clearOutgoingContexts();
      agent.add(randomElement(NON_RECYCLABLE));
    }

    function foodWaste(agent) {
      agent.clearOutgoingContexts();
      agent.add(randomElement(FOOD));
    }

    function failed(agent) {
      agent.clearOutgoingContexts();
      agent.add(randomElement(FAILED));
    }

    function plasticNoStretchIntent(agent) {
      agent.add(randomElement(PLASTIC_NOSTRETCH));
    }

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
