import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import lodash from "lodash";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

const quizCategories = {'General Knowledge': 9, 'Entertainment:Books': 10, 'Entertainment: Music': 12, 'Video Games': 15, 'Science & Nature': 17, 'Science: Computers': 18, 'History': 23, 'Politics': 24, 'Animals': 27, 'Vehicles': 28, 'Gadgets': 30, 'Japanese Anime & Manga': 31, 'Cartoon & Animations': 32, 'Board Games': 16, 'Sports': 21, ' Entertainment: Films': 11, 'Entertainment: Musicals & Theatres': 13, 'Television': 14};
const difficultyLevels = ['easy', 'medium', 'hard'];
const questionTypes = {'Multiple Choice': 'multiple', 'True or False': 'boolean'};
const numberOfQuestions = ['5', '10', '15', '20', '25', '30'];

// app.set('view engine', 'ejs');


app.get('/', async (req, res) => {
    res.render('index.ejs', {category: quizCategories, level: difficultyLevels, type: questionTypes, number: numberOfQuestions});
});

app.post('/', async (req, res) => {

    // const quizCategories = {'General Knowledge': 9, 'Books': 10, 'Music': 12, 'Video Games': 15, 'Nature': 17, 'Computers': 18, 'History': 23, 'Politics': 24, 'Animals': 27, 'Vehicles': 28, 'Gadgets': 30, 'Anime': 31};
    // const difficultyLevels = ['easy', 'medium', 'hard'];
    // const questionTypes = {'Multiple Choice': 'multiple', 'True or False': 'boolean'};
    // const questionNumbers = ['5', '10', '15', '20', '25', '30'];


    try {

        const quizCategory = req.body.quizCategory;
        const difficultyLevel = req.body.difficultyLevel;
        const questionType = req.body.questionType;
        const numberOfQuestions = req.body.numberOfQuestions;

        const apiUrl = `https://opentdb.com/api.php?amount=${encodeURIComponent(numberOfQuestions)}&category=${encodeURIComponent(quizCategory)}&difficulty=${encodeURIComponent(difficultyLevel)}&type=${encodeURIComponent(questionType)}`

        const response = await axios.get(apiUrl);
        const result = response.data;
        console.log(result);
        console.log('Quiz Category Number', quizCategory)

        if (result.response_code === 0) {
            res.redirect(`/quizPage?data=${encodeURIComponent(JSON.stringify(result.results))}&categoryNumber=${encodeURIComponent(quizCategory)}`);
        } else {
            res.render('index.ejs', {
                category: quizCategories,
                level: difficultyLevels,
                type: questionTypes,
                number: questionNumbers,
                error: 'No questions available for the selected criteria.'
            });
        }

    } catch (error) {
        console.error('Failed to make request:', error.message),
        res.render('index.ejs', {error: 'Failed to fetch data from API.'});
    }

    
})

app.post("/quizPage", (req, res) => {
    const quizData = req.body.quizData ? JSON.parse(decodeURIComponent(req.body.quizData)) : null;
    const currentQuestion = parseInt(req.body.currentQuestion);
    const action = req.body.action;
    let score = parseInt(req.body.score) || 0;
    const categoryNumber = req.body.quizCategoryNumber;

    // const selectedAnswer = req.body.selectedAnswer;
    // const correctAnswer = quizData[currentQuestion -1].correctAnswer;

    // if (selectedAnswer === correctAnswer) {
    //     score += 1;
    // }

    if (quizData) {
        if (action === 'next') {
            res.render("quizPage.ejs", {data: quizData, currentQuestion: currentQuestion + 1, currentScore: score, quizCategoryNumber: categoryNumber});
        } else if (action === 'end') {
            res.redirect(`/resultsPage?score=${score}&data=${encodeURIComponent(JSON.stringify(quizData))}&categoryNumber=${encodeURIComponent(categoryNumber)}`);
        }
    } else {
        res.render("quizPage.ejs", {data: null});
    }
});

app.get("/quizPage", (req, res) => {
    const quizData = req.query.data ? JSON.parse(decodeURIComponent(req.query.data)) : null;
    const score = parseInt(req.query.score) || 0;
    const categoryNumber = req.query.categoryNumber;

    if (quizData) {
        quizData.forEach(question => {
            let answerOptions = [...question.incorrect_answers, question.correct_answer];
            question.shuffledAnswers = lodash.shuffle(answerOptions);
        });
    }
    res.render("quizPage.ejs", {data: quizData, currentQuestion: 1, currentScore: score, quizCategoryNumber: categoryNumber});
  })

  

  app.post("/resultsPage", (req, res) => {
    const score = parseInt(req.body.score) || 0;
    const quizData = req.body.quizData ? JSON.parse(decodeURIComponent(req.body.quizData)) : null;

    if (quizData) {
        const totalQuestions = quizData.length
        res.render("resultsPage.ejs", {userScore: score, data: quizData, totalQuestions: totalQuestions});

    }


    
  })

  app.get("/resultsPage", (req, res) => {
    const score = parseInt(req.query.score) || 0;
    const quizData = req.query.data ? JSON.parse(decodeURIComponent(req.query.data)) : null;

    if (quizData) {
        const totalQuestions = quizData.length
        res.render("resultsPage.ejs", {userScore: score, data: quizData, totalQuestions: totalQuestions});

    }

    // const quizData = req.body.quizData ? JSON.parse(decodeURIComponent(req.body.quizData)) : null;


    // res.render("resultsPage.ejs", {data: quizData, userScore: score});

  });

  app.post("/retry", (req, res) => {
    
    const quiz = req.body.quizData ? JSON.parse(decodeURIComponent(req.body.quizData)) : null;
    if (quiz) {
        res.redirect(`/quizPage?data=${encodeURIComponent(JSON.stringify(quiz))}&score=0`);
    } else {
        res.render("quizPage.ejs", {data: null});
    }
  })


app.listen(port, () => {
    console.log(`Server running on port: ${port}`)
});