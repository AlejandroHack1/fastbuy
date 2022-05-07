const express = require('express');
const bodyParser = require('body-parser');
const cors = require('./cors');
const Products = require('../models/products');
const authenticate = require('../authenticate');
const { ObjectId } = require('mongodb');

const productRouter = express.Router();
productRouter.use(bodyParser.json());

//user view products
productRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, (req, res, next) => {
        Products.find({})
            .populate('comments.author')
            .then((products) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(products);
            }, (err) => next(err))
            .catch((err) => next(err));
    })

    //only admin add products
    .post(cors.corsWithOptions, authenticate.verifyAdmin, (req, res, next) => {
        Products.create(req.body)
            .then((product) => {
                console.log('Product Created', product);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(product);
            }, (err) => next(err))
            .catch((err) => next(err));
    })

    .put(cors.corsWithOptions, (req, res, next) => {
        res.statusCode = 403;
        res.end('Put operation not supported on /products');
    })

    //admin delete products
    .delete(cors.corsWithOptions, authenticate.verifyAdmin, (req, res, next) => {
        Products.remove({})
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    });



productRouter.route('/:productId')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })

    //user view product by category or Id
    .get(cors.cors, (req, res, next) => {

        Products.find({ category: `${req.params.productId}`  })
            .then((product) => {
                if (product) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(product);
                }
                else {
                    Products.findById(req.params.productId)
                        .populate('comments.author')
                        .then((product) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(product);
                        }, (err) => next(err))
                        .catch((err) => next(err));
                }

            })
    })

    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /PRODUCTS/'
            + req.params.productId);
    })

    //admin product edit
    .put(cors.corsWithOptions, authenticate.verifyAdmin, (req, res, next) => {
        Products.findByIdAndUpdate(req.params.productId, {
            $set: req.body
        }, { new: true })
            .then((product) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(product);
            }, (err) => next(err))
            .catch((err) => next(err));

    })

    //admin delete
    .delete(cors.corsWithOptions, authenticate.verifyAdmin, (req, res, next) => {
        Products.findByIdAndRemove(req.params.productId)
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));

    });

productRouter.route('/:productId/comments')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    //get comments user
    .get(cors.cors, (req, res, next) => {
        Products.findById(req.params.productId)
            .populate('comments.author')
            .then((product) => {
                if (product != null) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(dish.comments);
                }
                else {
                    err = new Error('product ' + req.params.productId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })

    //comments for login user
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Products.findById(req.params.productId)
            .then((product) => {
                if (product != null) {
                    req.body.author = req.user._id;
                    product.comments.push(req.body);
                    product.save()
                        .then((product) => {
                            Products.findById(product._id)
                                .populate('comments.author')
                                .then((product) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(product);
                                })

                        }, (err) => next(err));
                }
                else {
                    err = new Error('product ' + req.params.productId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })

    .put(cors.corsWithOptions, (req, res, next) => {
        res.statusCode = 403;
        res.end('Put operation not supported on /products'
            + req.params.productId + '/comments');
    })

    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Products.findById(req.params.productId)
            .then((product) => {
                if (product != null) {

                    for (var i = (product.comments.length - 1); i >= 0; i--) {
                        product.comments.id(product.comments[i]._id).remove();
                    }

                    product.save()
                        .then((product) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'aplication/json');
                            res.json(product);
                        }, (err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

productRouter.route('/:productId/comments/:commentId')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, (req, res, next) => {
        let o_id = new ObjectId(req.params.productId);
        Products.findById(o_id)
            .populate('comments.author')
            .then((product) => {
                if (product != null && product.comments.id(req.params.commentId) != null) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(product.comments.id(req.params.commentId));
                }
                else if (product == null) {
                    err = new Error('product ' + req.params.productId + ' not found');
                    err.status = 404;
                    return next(err);

                }
                else {
                    err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })

    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /products/' + req.params.productId
            + '/comments/' + req.params.commentId);
    })

    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        let o_id = new ObjectId(req.params.productId);
        Products.findById(o_id)
            .then((product) => {
                if (product != null && product.comments.id(req.params.commentId) != null) {

                    //The user should be restricted to perform such operations only on his/her own comments
                    Products.find({ "comments": { $elemMatch: { author: req.user._id } } }, (error, commentAuthor) => {

                        if (commentAuthor) {


                            if (req.body.rating) {
                                product.comments.id(req.params.commentId).rating = req.body.rating;
                            }
                            if (req.body.comment) {

                                product.comments.id(req.params.commentId).comment = req.body.comment;

                            }
                            product.save()
                                .then((product) => {
                                    Products.findById(product._id)
                                        .populate('comments.author')
                                        .then((product) => {
                                            res.statusCode = 200;
                                            res.setHeader('Content-Type', 'application/json');
                                            res.json(product);
                                        })
                                }, (err) => next(err));

                        }

                        else {
                            err = new Error('You are not authorized to update this comment!');
                            err.status = 403;
                            return next(err);
                        }


                    });
                }
                else if (product == null) {
                    err = new Error('Product ' + req.params.productId + ' not found');
                    err.status = 404;
                    return next(err);

                }
                else {
                    err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));

    })

    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

        Products.findById(req.params.productId)
            .then((product) => {

                if (product != null && product.comments.id(req.params.commentId) != null) {

                    //The user should be restricted to perform such operations only on his/her own comments
                    Products.find({ "comments": { $elemMatch: { author: req.user._id } } }, (error, commentAuthor) => {

                        if (commentAuthor) {


                            product.comments.id(req.params.commentId).remove();

                            product.save()
                                .then((product) => {
                                    Products.findById(product._id)
                                        .populate('comments.author')
                                        .then((product) => {
                                            res.statusCode = 200;
                                            res.setHeader('Content-Type', 'application/json');
                                            res.json(product);
                                        })
                                }, (err) => next(err));

                        }

                        else {
                            err = new Error('You are not authorized to delete this comment!');
                            err.status = 403;
                            return next(err);
                        }


                    });
                }

                else if (product == null) {
                    err = new Error('Product ' + req.params.productId + ' not found');
                    err.status = 404;
                    return next(err);

                }
                else {
                    err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    return next(err);
                }


            }, (err) => next(err))
            .catch((err) => next(err));



    });



module.exports = productRouter;

