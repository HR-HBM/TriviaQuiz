import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import lodash from "lodash";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

const quizCategories = {'General Knowledge': 9, 'Books': 10, 'Music': 12, 'Video Games': 15, 'Nature': 17, 'Computers': 18, 'History': 23, 'Politics': 24, 'Animals': 27, 'Vehicles': 28, 'Gadgets': 30, 'Anime': 31};
const difficultyLevels = ['easy', 'medium', 'hard'];
const questionTypes = {'Multiple Choice': 'multiple', 'True or False': 'boolean'};
const numberOfQuestions = ['5', '10', '15', '20', '25', '30'];

// app.set('view engine', 'ejs');


app.get('/', async (req, res) => {
    res.render('index.ejs', {category: quizCategories, level: difficultyLevels, type: questionTypes, number: numberOfQuestions});
});

app.post('/', async (req, res) => {

    const quizCategories = {'General Knowledge': 9, 'Books': 10, 'Music': 12, 'Video Games': 15, 'Nature': 17, 'Computers': 18, 'History': 23, 'Politics': 24, 'Animals': 27, 'Vehicles': 28, 'Gadgets': 30, 'Anime': 31};
    const difficultyLevels = ['easy', 'medium', 'hard'];
    const questionTypes = {'Multiple Choice': 'multiple', 'True or False': 'boolean'};
    const questionNumbers = ['5', '10', '15', '20', '25', '30'];


    try {

        const quizCategory = req.body.quizCategory;
        const difficultyLevel = req.body.difficultyLevel;
        const questionType = req.body.questionType;
        const numberOfQuestions = req.body.numberOfQuestions;

        const apiUrl = `https://opentdb.com/api.php?amount=${encodeURIComponent(numberOfQuestions)}&category=${encodeURIComponent(quizCategory)}&difficulty=${encodeURIComponent(difficultyLevel)}&type=${encodeURIComponent(questionType)}`

        const response = await axios.get(apiUrl);
        const result = response.data;
        console.log(result);

        if (result.response_code === 0) {
            res.redirect(`/quizPage?data=${encodeURIComponent(JSON.stringify(result.results))}`);
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

    if (quizData) {

    if (action === 'next') {
        res.render("quizPage.ejs", {data: quizData, currentQuestion: currentQuestion + 1});
    } else if (action === 'end') {
        res.redirect('/resultsPage');
    }
} else {
    res.render("quizPage.ejs", {data: null});
}

});


app.get("/quizPage", (req, res) => {
    const quizData = req.query.data ? JSON.parse(decodeURIComponent(req.query.data)) : null;

    if (quizData) {
        quizData.forEach(question => {

            let answerOptions = [...question.incorrect_answers, question.correct_answer];
            question.shuffledAnswers = lodash.shuffle(answerOptions);
            
        });
    }

    res.render("quizPage.ejs", {data: quizData, currentQuestion: 1});
  })

  app.get("/resultsPage", (req, res) => {
    const results = "your total score is";

    res.render("resultsPage.ejs", {score: results});

  });


app.listen(port, () => {
    console.log(`Server running on port: ${port}`)
});