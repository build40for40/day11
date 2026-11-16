import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { IDEAS, itemsInText, matchIdea } from "./ideas.js";
import { sentences, wordCount, questionCount, plainSpeechIssue } from "./text.js";
import { foldDisfluency, isClearNo, isClearYes, isPromise, isStop, santaLine } from "./text.js";

describe("kid language", () => {
  it("treats mmm no as no and a plain yes as yes", () => {
    assert.equal(isClearYes("Mmm no."), false);
    assert.equal(isClearNo("Mmm no."), true);
    assert.equal(isClearYes("Yes!"), true);
    assert.equal(isClearYes("Yes please."), true);
    assert.equal(isClearYes("Yeah!"), true);
    assert.equal(isClearYes("I want that."), true);
    assert.equal(isClearYes("Aye."), true);
    assert.equal(isClearYes("That one."), true);
    assert.equal(isClearNo("Nowt."), true);
    assert.equal(foldDisfluency("B-b-blocks"), "blocks");
    assert.match(santaLine("your dads", "wishlist"), /your dads/i);
    assert.equal(/Santa/i.test(santaLine("your grown-up", "wishlist")), false);
    assert.equal(isClearYes("Yes. I want everything."), false);
    assert.equal(isClearYes("I don't know."), false);
    assert.equal(isStop("That's enough."), true);
    assert.equal(isStop("I'm done."), true);
    assert.equal(isStop("I want to go."), true);
    assert.equal(isStop("bye"), true);
    assert.equal(isStop("I'm walking away."), true);
    assert.equal(isStop("I'm going to build a castle."), false);
    assert.equal(isPromise("I can't promise a real pony."), false);
    assert.equal(isPromise("I promise you will get it."), true);
  });
});

describe("idea lines", () => {
  it("are one short question and name the item", () => {
    for (const idea of IDEAS) {
      assert.equal(questionCount(idea.line), 1, idea.item);
      assert.ok(itemsInText(idea.line).includes(idea.item), idea.line);
      assert.equal(plainSpeechIssue(idea.line), undefined, idea.item);
      for (const sentence of sentences(idea.line)) {
        assert.ok(wordCount(sentence) <= 20, `${idea.item}: ${sentence}`);
      }
    }
  });

  it("matches the earliest interest word", () => {
    assert.equal(matchIdea("I like dinosaurs and mud.")?.item, "wooden dinosaur figures");
    assert.equal(matchIdea("mmm blocks")?.item, "wooden building blocks");
    assert.equal(matchIdea("The ball.")?.item, "soft ball");
  });
});
