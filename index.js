import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import lodash from "lodash";
import { pool } from "./dbConfig.js";
import bcrypt from "bcrypt";
import session from "express-session";
import flash from "express-flash";
import passport from "passport";
import initializePassport from "./passportConfig.js";


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

initializePassport(passport);


app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'secret', 
    resave: false,
    saveUninitialized: false
})
);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());


const quizCategories = {'General Knowledge': 9, 'Entertainment:Books': 10, 'Entertainment: Music': 12, 'Video Games': 15, 'Science & Nature': 17, 'Science: Computers': 18, 'History': 23, 'Politics': 24, 'Animals': 27, 'Vehicles': 28, 'Gadgets': 30, 'Japanese Anime & Manga': 31, 'Cartoon & Animations': 32, 'Board Games': 16, 'Sports': 21, ' Entertainment: Films': 11, 'Entertainment: Musicals & Theatres': 13, 'Television': 14};
const difficultyLevels = ['easy', 'medium', 'hard'];
const questionTypes = {'Multiple Choice': 'multiple', 'True or False': 'boolean'};
const numberOfQuestions = ['5', '10', '15', '20', '25', '30'];

app.get("/", (req, res) => {
    res.render('landingPage.ejs')
})

app.get('/users/quiz', async (req, res) => {
    res.render('index.ejs', {category: quizCategories, user: req.user ? req.user.name : null, level: difficultyLevels, type: questionTypes, number: numberOfQuestions});
});

app.post('/users/quiz', async (req, res) => {

    try {

        const quizCategory = req.body.quizCategory;
        const difficultyLevel = req.body.difficultyLevel;
        const questionType = req.body.questionType;
        const numberOfQuestions = req.body.numberOfQuestions;

        const apiUrl = `https://opentdb.com/api.php?amount=${encodeURIComponent(numberOfQuestions)}&category=${encodeURIComponent(quizCategory)}&difficulty=${encodeURIComponent(difficultyLevel)}&type=${encodeURIComponent(questionType)}`

        const response = await axios.get(apiUrl);
        const result = response.data;

        if (result.response_code === 0) {
            req.session.quizData = result.results;
            req.session.quizCategoryNumber = quizCategory;

            res.redirect('/quizPage');
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
        res.render('index.ejs', {error: 'No questions available for the selected criteria. Please retry by selecting a lower number of questions.'});
    }

    
})

app.get("/users/register", (req, res) => {
    res.render("register.ejs");
})

app.get("/users/login", (req, res) => {
    res.render("login.ejs");
})

app.get("/users/logout", (req, res) => {
    req.logOut (function(err) {
        if (err) { 
            return next(err); 
        };
    req.flash("success_msg", "You have successfully logged out");
    res.render('landingPage.ejs');

});
});

app.post ("/users/register", async (req, res) => {
    let { name, email, password, password2 } = req.body;

    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({message:"Please enter all fields!"});
    }

    if (password.length < 6) {
        errors.push({message: "Password should be at least 6 characters!"});
    }
    if (password != password2) {
        errors.push({message: "Passwords do not match!"});
    }

    if (errors.length > 0) {
        res.render("register.ejs", {errors});
    } else {
        let hashedPassword = await bcrypt.hash(password, 10);

        pool.query(
            `SELECT * FROM users
            WHERE email = $1`,
            [email],
            (err, results) => {
                if (err) {
                    throw err;
                }

                if (results.rows.length > 0) {
                    errors.push({message:"Email already exists!"});
                    res.render("register.ejs", {errors});
                } else {
                    pool.query(
                        `INSERT INTO users (name, email, password)
                        VALUES ($1, $2, $3)
                        RETURNING id, password`,
                        [name, email, hashedPassword],
                        (err, results) => {
                            if (err) {
                                throw err;
                            }

                            req.flash("success_msg", "You are now registered. Please log in to continue.")
                            res.redirect("/users/login");

                        }
                    );
                }
        
            }
        );
    }
});

app.post("/users/login", passport.authenticate("local", {
    successRedirect: "/users/quiz",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);




app.post("/quizPage", (req, res) => {
    const quizData = req.session.quizData;
    const currentQuestion = parseInt(req.body.currentQuestion);
    const action = req.body.action;
    let score = parseInt(req.body.score) || 0;
    const categoryNumber = req.session.quizCategoryNumber;

    if (quizData) {
        if (action === 'next') {
            res.render("quizPage.ejs", {data: quizData, currentQuestion: currentQuestion + 1, currentScore: score, quizCategoryNumber: categoryNumber});
        } else if (action === 'end') {
            req.session.quizResults = {
                score: score,
                data: quizData,
                categoryNumber: categoryNumber,
                totalQuestions: quizData.length
            };
            res.redirect("/resultsPage");


        }
    } else {
        res.render("quizPage.ejs", {data: null});
    }
});

app.get("/quizPage", (req, res) => {
    const quizData = req.session.quizData;
    const score = parseInt(req.query.score) || 0;
    const categoryNumber = req.session.quizCategoryNumber;

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
    const categoryNumber = req.body.quizCategoryNumber;

    if (quizData) {
        const totalQuestions = quizData.length
        res.render("resultsPage.ejs", {userScore: score, data: quizData, totalQuestions: totalQuestions, quizCategoryNumber: categoryNumber});

    }


    
  })

  app.get("/resultsPage", (req, res) => {
    const quizResults = req.session.quizResults;
    if (quizResults) {
        res.render("resultsPage.ejs", {
            userScore: quizResults.score,
            data: quizResults.data,
            totalQuestions: quizResults.totalQuestions,
            quizCategoryNumber: quizResults.categoryNumber
        });
        req.session.quizResults = null;
    } else {
        res.redirect("/users/quiz");
    }

  });

  app.post("/retry", (req, res) => {
    
    const quiz = req.body.quizData ? JSON.parse(decodeURIComponent(req.body.quizData)) : null;
    const quizCategoryNumber = req.body.quizCategoryNumber
    if (quiz) {
        res.redirect(`/quizPage?data=${encodeURIComponent(JSON.stringify(quiz))}&score=0&categoryNumber=${encodeURIComponent(quizCategoryNumber)}`);
    } else {
        res.render("quizPage.ejs", {data: null});
    }
  })


app.listen(port, () => {
    console.log(`Server running on port: ${port}`)
});