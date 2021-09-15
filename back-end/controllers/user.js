const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const cryptoJs = require("crypto-js/md5");

// Création d'un nouvel utilisateur
exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: cryptoJs(req.body.email).toString(),
                password: hash
            });
            user.save()
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

// Connexion à un compte déjà existant
exports.login = (req, res, next) => {
    User.findOne({ email: cryptoJs(req.body.email).toString() })
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: 'Utilisateur non trouvé !' });
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ message: 'Mot de passe incorrect !' })
                    }
                    const token = jwt.sign(
                        { userId: user._id },
                        "RANDOM_TOKEN_SECRET",
                        { expiresIn: "24h" }
                    )
                    res.status(200).json({
                        userId: user._id,
                        token
                    })
                })
                .catch(error => res.status(500).json({ error: error.message }));
        })
        .catch(error => res.status(500).json({ error }));
};