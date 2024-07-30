import * as data from "./data.js";

let answers;

async function askQuestion() {
  answers = await data.getRandomQuestion();

  const question = answers.find((a) => a.correct).word;
  const japToEng = $(".jap-eng").hasClass("is-active");
  $("#mondai").html(japToEng ? `<ruby>${question.word}<rp>(</rp><rt>${question.hiragana}</rt><rp>)</rp></ruby>` : question.meaningAll);
  $(".kotae").each(function (i, e) {
    const kotae = answers[i].word;
    $(e).html(japToEng ? kotae.meaningAll : `<ruby>${kotae.word}<rp>(</rp><rt>${kotae.hiragana}</rt><rp>)</rp></ruby>`);
    $(e).data("correct", String(answers[i].correct));
  });

  $("rt, rp").hide();
  $("#showFuriganaMCQ").prop("checked", false);

  $("#mcq").show();
  $("#result").hide();
}

async function setPercentComplete() {
  const { percentComplete, userLevel } = await data.getUserPercentComplete();
  $("#completeCounter").text(`${Math.round(percentComplete * 10000) / 100}% complete`);
  $("#userLevel").text(`Level ${Math.ceil(userLevel)}`);
  $(".points").show();
}

$(".mode").on("click", function () {
  askQuestion();
});

$(".kotae").on("click", async function (e) {
  $("#result").show();
  $("#mcq").hide();
  const isCorrect = $(e.target).data("correct") === "true";
  $(isCorrect ? "#correctIcon" : "#incorrectIcon").show();
  $(isCorrect ? "#incorrectIcon" : "#correctIcon").hide();
  $("#answer")
    .addClass(isCorrect ? "correct" : "incorrect")
    .removeClass(isCorrect ? "incorrect" : "correct");

  const correctAnswer = answers.find((a) => a.correct).word;
  $("#answerWord").text(correctAnswer.word);
  $("#more").prop(
    "href",
    `https://jotoba.com/search/0/${correctAnswer.word}?l=en-US`
  );
  $("#hiragana").text(correctAnswer.hiragana);
  $("#meaning").text(correctAnswer.meaningAll);
  $("#showFurigana").parent().hide();
  $("#sentence").html(
    correctAnswer.sentence?.replace(
      /([一-龠]+)\[(.*?)\]/g,
      (match, kanji, hiragana) => {
        $("#showFurigana").parent().show();
        $("#showFurigana").prop("checked", false);
        return `<ruby>${kanji}<rp>(</rp><rt>${hiragana}</rt><rp>)</rp></ruby>`;
      }
    )
  );
  $("#sentenceMeaning").text(correctAnswer.sentencemeaning);
  $("#moreSentence").prop(
    "href",
    `https://jotoba.com/search/0/${correctAnswer.sentence?.replace(
      /[<\[].*?[>\]]/g,
      ""
    )}?l=en-US`
  );
  if (isCorrect) {
    await data.setCorrectAnswerCount(correctAnswer, 1, true);
    if (await data.wordIsDone(correctAnswer)) {
      await data.updateUserLevel(correctAnswer.level);
    }
  } else {
    await data.setCorrectAnswerCount(correctAnswer, 0);
  }
  setPercentComplete();
  $("rt, rp").hide();
});

$("#showFurigana, #showFuriganaMCQ").on("click", function (e) {
  if ($(e.target).is(":checked")) {
    $("rt, rp").show();
  } else {
    $("rt, rp").hide();
  }
});
askQuestion();
setPercentComplete();
