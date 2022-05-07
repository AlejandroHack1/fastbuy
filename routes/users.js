var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
const Products = require('../models/products');
var passport = require('passport');
var authenticate = require('../authenticate');
const cors = require('./cors');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
router.get('/', cors.corsWithOptions, authenticate.verifyAdmin, function (req, res, next) {
  User.find({})
    .then((users) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
    }, (err) => next(err))
    .catch((err) => next(err));
});

router.post('/signup', cors.corsWithOptions, (req, res, next) => {
  User.register(new User({ username: req.body.username }),
    req.body.password, (err, user) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({ err: err });
      }
      else {
        if (req.body.firstname)
          user.firstname = req.body.firstname;
        if (req.body.lastname)
          user.lastname = req.body.lastname;
        user.save((err, user) => {
          if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({ err: err });
            return;
          }
          passport.authenticate('local')(req, res, () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: true, status: 'Registration Successful' });

          })
        });
      }

    });
});

router.post('/login', cors.corsWithOptions, (req, res, next) => {

  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);

    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({ success: false, status: 'Login Unsuccessful!', err: info });
    }

    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!' });
      }

      var token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({ success: true, token: token, status: 'You are successfully logged in!' });
    })
  })(req, res, next);

});

router.get('/logout', cors.corsWithOptions, (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

//add product to cart
router.post('/cart/:productId', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

  //check if product exists
  Products.findById(req.params.productId)
    .then((product) => {
      if (product) {

        //add product to cart
        User.findByIdAndUpdate(req.user._id,
          { "$push": { "cart": product } },
          { "new": true, "upsert": true })
          .populate('cart')

          .then((post) => {

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(post);

          }, (err) => next(err))
          .catch((err) => next(err));

      }
      else {
        err = new Error('Product ' + req.params.productId + ' cannot find');
        err.status = 404;
        next(err);
      }

    }, (err) => next(err))
    .catch((err) => next(err));

});


//get products to cart
router.get('/cart', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

  //Allowed users to retrieve the list of their products cart
  User.findById(req.user._id)
    .populate('cart')
    .then((products) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(products);
    }, (err) => next(err))
    .catch((err) => next(err));

});

//delete all products in cart
router.delete('/cart', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

  User.findById(req.user._id)
    .then((user) => {
      if (user != null) {

        if (user.cart.length != 0) {
          for (var i = (user.cart.length - 1); i >= 0; i--) {

            User.updateOne(
              { "cart": user.cart[i] },
              { "$pull": { "cart": user.cart[i] } },
              { "multi": true },
              function (err, status) {

                if (status) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(status);
                } else {

                  next(err);

                }

              }
            )

          }
        }
        else {
          err = new Error('User not has products in cart');
          err.status = 404;
          return next(err);
        }

      }
    }, (err) => next(err))
    .catch((err) => next(err));
});


//delete product by ID in cart
router.delete('/cart/:productId', cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

  User.findById(req.user._id)
    .then((user) => {
      if (user != null) {

        if (user.cart.length != 0) {

          User.updateOne(
            { "cart": req.params.productId },
            { "$pull": { "cart": req.params.productId } },
            { "multi": true },
            function (err, status) {

              if (status) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(status);
              } else {

                next(err);

              }

            }
          )
        }
        else {
          err = new Error('User not has products in cart');
          err.status = 404;
          return next(err);
        }

      }
    }, (err) => next(err))
    .catch((err) => next(err));
});


router.get('/checkJWTtoken', cors.corsWithOptions, (req, res) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err)
      return next(err);

    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: 'JWT invalid!', success: false, err: info });
    }
    else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: 'JWT valid!', success: true, user: user });

    }
  })(req, res);
});


module.exports = router;
