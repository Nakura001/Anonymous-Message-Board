const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let testThreadId;
let testReplyId;

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
      chai.request(server)
        .post('/api/threads/test')
        .send({
          text: 'Test thread text',
          delete_password: 'password123'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.equal(res.body.text, 'Test thread text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'bumped_on');
          assert.property(res.body, 'replies');
          assert.isArray(res.body.replies);
          assert.notProperty(res.body, 'delete_password');
          assert.notProperty(res.body, 'reported');
          
          // Guardar el ID del hilo para pruebas posteriores
          testThreadId = res.body._id;
          done();
        });
    });
    
    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
      chai.request(server)
        .get('/api/threads/test')
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtMost(res.body.length, 10);
          
          if (res.body.length > 0) {
            assert.property(res.body[0], '_id');
            assert.property(res.body[0], 'text');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'bumped_on');
            assert.property(res.body[0], 'replies');
            assert.isArray(res.body[0].replies);
            assert.isAtMost(res.body[0].replies.length, 3);
            
            // Verificar que campos sensibles no estén presentes
            assert.notProperty(res.body[0], 'delete_password');
            assert.notProperty(res.body[0], 'reported');
            
            // Verificar que las respuestas no tengan campos sensibles
            if (res.body[0].replies.length > 0) {
              assert.notProperty(res.body[0].replies[0], 'delete_password');
              assert.notProperty(res.body[0].replies[0], 'reported');
            }
          }
          done();
        });
    });
    
    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with invalid delete_password', function(done) {
      chai.request(server)
        .delete('/api/threads/test')
        .send({
          thread_id: testThreadId,
          delete_password: 'wrongpassword'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });
    
    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with valid delete_password', function(done) {
      // Primero crear un nuevo hilo para eliminar
      chai.request(server)
        .post('/api/threads/test')
        .send({
          text: 'Thread to delete',
          delete_password: 'deletepass'
        })
        .end(function(err, res) {
          const threadIdToDelete = res.body._id;
          
          // Ahora eliminar el hilo con la contraseña correcta
          chai.request(server)
            .delete('/api/threads/test')
            .send({
              thread_id: threadIdToDelete,
              delete_password: 'deletepass'
            })
            .end(function(err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'success');
              done();
            });
        });
    });
    
    test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
      chai.request(server)
        .put('/api/threads/test')
        .send({
          thread_id: testThreadId
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
      chai.request(server)
        .post('/api/replies/test')
        .send({
          thread_id: testThreadId,
          text: 'Test reply text',
          delete_password: 'replypass'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.equal(res.body.text, 'Test reply text');
          assert.property(res.body, 'created_on');
          assert.notProperty(res.body, 'delete_password');
          assert.notProperty(res.body, 'reported');
          
          // Guardar el ID de la respuesta para pruebas posteriores
          testReplyId = res.body._id;
          done();
        });
    });
    
    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
      chai.request(server)
        .get('/api/replies/test')
        .query({ thread_id: testThreadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'bumped_on');
          assert.property(res.body, 'replies');
          assert.isArray(res.body.replies);
          
          // Verificar que campos sensibles no estén presentes
          assert.notProperty(res.body, 'delete_password');
          assert.notProperty(res.body, 'reported');
          
          // Verificar que las respuestas no tengan campos sensibles
          if (res.body.replies.length > 0) {
            assert.notProperty(res.body.replies[0], 'delete_password');
            assert.notProperty(res.body.replies[0], 'reported');
            assert.property(res.body.replies[0], '_id');
            assert.property(res.body.replies[0], 'text');
            assert.property(res.body.replies[0], 'created_on');
          }
          done();
        });
    });
    
    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with invalid delete_password', function(done) {
      chai.request(server)
        .delete('/api/replies/test')
        .send({
          thread_id: testThreadId,
          reply_id: testReplyId,
          delete_password: 'wrongpassword'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });
    
    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with valid delete_password', function(done) {
      chai.request(server)
        .delete('/api/replies/test')
        .send({
          thread_id: testThreadId,
          reply_id: testReplyId,
          delete_password: 'replypass'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
    
    test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
      // Primero crear una nueva respuesta para reportar
      chai.request(server)
        .post('/api/replies/test')
        .send({
          thread_id: testThreadId,
          text: 'Reply to report',
          delete_password: 'testpass'
        })
        .end(function(err, res) {
          const replyIdToReport = res.body._id;
          
          // Ahora reportar la respuesta
          chai.request(server)
            .put('/api/replies/test')
            .send({
              thread_id: testThreadId,
              reply_id: replyIdToReport
            })
            .end(function(err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'reported');
              done();
            });
        });
    });

  });

});