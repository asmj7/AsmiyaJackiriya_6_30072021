const Sauce = require('../models/sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Objet enregistré !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body }
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(201).json({ message: 'Objet modifié !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Object supprimé !' }))
                    .catch(error => res.status(400).json({ error }));
            })
        })
        .catch(error => res.status(500).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

exports.likeDislikeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            let like = (req.body.like);
            let opinions = {};
            switch (like) {
                case -1:
                    opinions = {
                        $push: { userDisliked: req.body.userId },
                        $inc: { dislikes: 1 }
                    }
                    break;
                case 0:
                    for (let userId of sauce.userDisliked)
                        if (req.body.userId === userId) {
                            opinions = {
                                $pull: { userDisliked: userId },
                                $inc: { dislikes: -1 }
                            };
                        };
                    for (let userId of sauce.userLiked)
                        if (req.body.userId === userId) {
                            opinions = {
                                $pull: { userLiked: userId },
                                $inc: { likes: 1 }
                            };
                        };
                    break;
                case 1:
                    opinions = {
                        $push: { userLiked: req.body.userId },
                        $inc: { likes: 1 }
                    };
                    break;
            };
            Sauce.updateOne({ _id: req.params.id }, opinions)
                .then(() => res.status(200).json({ message: "La sauce a été liké" }))
                .catch(error => res.status(400).json({ error }))
        })
        .catch(error => res.status(500).json({ error }));
};