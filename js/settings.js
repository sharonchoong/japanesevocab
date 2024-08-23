import * as data from "./data.js";

let vocabPage = 1;
let totalPages = 10;

async function initSettings() {
  await setPaginatedResults(1);
  await setPercentComplete();
}

async function setPercentComplete() {
  const { percentComplete, userLevel } = await data.getUserPercentComplete();
  $("#completeCounter").text(
    `${Math.round(percentComplete * 10000) / 100}% complete`
  );
  $("#userLevel").text(`Level ${Math.ceil(userLevel)}`);
  $(".points").show();
}

async function setPaginatedResults(number) {
  const nItemsPerPage = 10;
  let list = await data.getVocabList();
  const searchTerm = $("#searchVocab").val();
  let rows = "";

  if (searchTerm) {
    list = list.filter(
      (w) =>
        w.word.includes(searchTerm) ||
        w.hiragana.includes(searchTerm) ||
        wanakana
          .toRomaji(w.hiragana)
          .includes(searchTerm.toLocaleLowerCase()) ||
        w.meaning
          .toLocaleLowerCase()
          .includes(searchTerm.toLocaleLowerCase()) ||
        w.meaning2.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())
    );
  }

  totalPages = Math.ceil(list.length / nItemsPerPage);

  const showIncompleteOnly = $("#incompleteOnly").is(":checked");

  let filteredIndex = 0;
  let priorIndex = 0;
  for (let i = 0; i < list.length; i++) {
    const word = list[i];

    if (filteredIndex >= number * nItemsPerPage) {
      break;
    }

    const nCorrectAns = data.getCorrectAnswerCount(word);
    const minThreshold = data.getMinCorrectAnswerThreshold(word);
    if (
      !showIncompleteOnly ||
      (showIncompleteOnly && nCorrectAns < minThreshold)
    ) {
      filteredIndex += 1;
    }

    if (filteredIndex >= ((number - 1) * nItemsPerPage + 1) && priorIndex !== filteredIndex) {
      rows += `<tr>
          <td><ruby>${word.word}<rp>(</rp><rt>${
        word.hiragana
      }</rt><rp>)</rp></ruby></td>
          <td>${word.meaning}</td>
          <td>Index ${word.index}</td>
          <td>Level ${word.level}</td>
          <td>Set ${word.set}</td>
          <td class="large-text-center"><span class="hide-for-large">Correct answer goal: </span>${minThreshold}</td>
          <td class="large-text-center">
              <span class="hide-for-large">Consecutive correct answers made: </span>
              ${nCorrectAns}
              <button class="clear button alert reset ${
                nCorrectAns === 0 ? "disabled" : ""
              }" data-id="${data.getIdFromWord(word)}">Reset</button>
          </td>
          </tr>`;
      priorIndex = filteredIndex;
    }
  }
  $("#vocabTable tbody").empty();
  $("#vocabTable tbody").append(rows);

  // set pagination buttons
  $(".pagination-previous > a, .pagination-next > a").removeClass("disabled");
  if (number === 1) {
    $(".pagination-previous > a").addClass("disabled");
  } else if (number === totalPages) {
    $(".pagination-next > a").addClass("disabled");
  }
  $(".pagination-text").text(`Showing page ${number} of ${totalPages} pages`);
  vocabPage = number;
}

initSettings();

$("#searchVocab").on("keyup", function () {
  setPaginatedResults(1);
});

$("#vocabTable tbody").on("click", ".reset", async function (e) {
  const wordId = $(e.target).data("id");
  const list = await data.getVocabList();
  const word = list.find((w) => data.getIdFromWord(w) === wordId);
  if (word) {
    await data.setCorrectAnswerCount(word, 0);
    await setPaginatedResults(vocabPage);
    await setPercentComplete();
  }
});

$("#reset10").on("click", async function () {
  let list = await data.getVocabList();
  const level = $("#resetLevel").val();
  list = list.filter(
    (w) =>
      data.getCorrectAnswerCount(w) > 0 &&
      (level !== "any" ? Number(w.level) === Number(level) : true)
  );
  const words = data.chooseRandomWords(10, list);
  for (const word of words) {
    await data.setCorrectAnswerCount(word.word, 0);
  }
  await setPaginatedResults(vocabPage);
  await setPercentComplete();
});

$(".pagination-previous").on("click", function () {
  if (vocabPage > 1) {
    setPaginatedResults(vocabPage - 1);
  }
});

$(".pagination-next").on("click", function () {
  if (vocabPage < totalPages) {
    setPaginatedResults(vocabPage + 1);
  }
});

$("#incompleteOnly").on("click", function () {
  setPaginatedResults(vocabPage);
});
