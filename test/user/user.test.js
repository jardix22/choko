var assert = require('assert');
var request = require('supertest');

// Util variables.
var testingUrl = 'http://localhost:3200';

// User related utility functions.
var userHelper = {

  // Generate sample user data used in tests.
  sample: function (confirmation) {
    var user = {
      username: 'user',
      password: 'password',
      roles: [],
      email: 'email@email.com'
    };

    if (confirmation) {
      user['password-confirm'] = 'password';
    }

    return user;
  },

  // Generate credentials used in tests.
  credentials: function () {
    return {
      username: 'user',
      password: 'password'
    };
  }
};

describe('User extension', function(done) {

  it('should not authenticate an user with wrong credentials', function(done) {
    request(testingUrl)
      .post('/sign-in-submit')
      .send(userHelper.sample())
      .expect(401, done);
  });

  it('should authenticate an user with correct credentials', function(done) {
    var application = this.getServer().getApplication('localhost');
    var User = application.type('user');

    new User(userHelper.sample()).validateAndSave(function(error, newAccount) {
      if (error) {
        return assert.fail('error saving');
      }

      request(testingUrl)
        .post('/sign-in-submit')
        .send(userHelper.credentials())
        .expect(200, done);
    });
  });

  it('should not create an account via API with a password less then 6 characters long', function(done) {
    var application = this.getServer().getApplication('localhost');
    var User = application.type('user');

    var user = userHelper.sample();
    user.password = 'small';

    new User(user).validateAndSave(function(error, newAccount, errors) {
      if (error) {
        return assert.fail('error saving');
      }

      if (errors && errors.length && errors[0] == 'Password must have at least 6 characters.') {
        return done();
      }

      assert.fail('Saved user with invalid password');
    });
  });

  it('should create an user account via POST', function(done) {
    request(testingUrl)
      .post('/create-account-submit')
      .send(userHelper.sample(true))
      .expect(201, done);
  });

  it('should create an user account via POST and log in', function(done) {
    request(testingUrl)
      .post('/create-account-submit')
      .send(userHelper.sample(true))
      .expect(201, function () {
        request(testingUrl)
          .post('/sign-in-submit')
          .send(userHelper.credentials())
          .expect(200, done);
      });
  });
});