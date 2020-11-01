const express = require('express');
const router = express.Router();

const db = require('../lib/db.js');

router.post('/login', (req, res) => { //Login REST API which checks the UseId and password and loggs in
    db.query(
        `SELECT * FROM User WHERE UserId = ${db.escape(req.body.UserId)};`,
        (err, result) => {
            // user does not exists
            if (err) {
                return res.status(400).send({
                    msg: err
                });
            }
            if (!result.length) {
                return res.status(401).send({
                    msg: 'Username does not exist!'
                });
            }
            // check password
            if (result[0]['Password'] === req.body.Password) {
                return res.status(200).send({
                    msg: 'Logged in!',
                    User: result[0]['UserId']
                });
            } else {
                return res.status(401).send({
                    msg: 'Password is incorrect!'
                });
            }
        }
    );
});


// {
// 	"FormFieldName": ["First Name","Last Name","Phone Number","Email Address"],
// 	"FormFieldsType": ["Text","Text","Integer","Text"],
// 	"FormName": "Email Address",
// 	"UserId": "poojan"
// }
router.post('/addcustomfield', (req, res) => { //REST API for adding custom field and the above contains the request body parameters
    let FormId = -1;
    let FormName = '';
    var fieldtype = {};
    var FormFieldName = req.body.FormFieldName;
    var FormFieldType = req.body.FormFieldsType;
    var FieldNameType = {};
    for (var i = 0; i < FormFieldName.length; i++) {
        FieldNameType[FormFieldName[i]] = FormFieldType[i];
    }
    getFormName = function() { //Get the FormId,Form Name which was present for the User
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT FormId,FormName FROM Form WHERE UserId = ${db.escape(req.body.UserId)};`,
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }

    function formatDate(date) { //To get the date in correct format
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [year, month, day].join('-');
    }

    getFormName().then(function(result) {
            FormId = result[0]['FormId'];
            FormName = result[0]['FormName'];
            var date = new Date();
            date = formatDate(date);
            if (FormName === '' || FormName !== req.body.FormName) { //Update the FormName and CreatedDate if the user has changed it
                db.query(
                    `UPDATE Form SET FormName = ${db.escape(req.body.FormName)}, CreatedDate = ${db.escape(date)} WHERE UserId = ${db.escape(req.body.UserId)};`
                );
            }
            getFieldType = function() { //Get all the field types present in the table for mapping
                return new Promise((resolve, reject) => {
                    db.query(
                        `SELECT * FROM FieldType;`,
                        (err, result) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        }
                    );
                });
            }

            getFieldType().then(function(result) {
                    for (var i = 0; i < result.length; i++) {
                        fieldtype[result[i]['Name']] = result[i]['Id'];
                    }
                    if (FormId === -1) { //If the Form was not present, create all the fields
                        for (var i = 0; i < FormFieldName.length; i++) {
                            let type = FieldNameType[FormFieldName[i]];
                            db.query(
                                `INSERT INTO FormField(FormID,FieldTypeId,FieldName) VALUES(${db.escape(FormId)},${db.escape(fieldtype[type])},${db.escape(additionalelements[i])});`,
                                (err, result) => {
                                    if (err) {
                                        return res.status(400).send({
                                            msg: err
                                        });
                                    } else {
                                        return res.status(200).send({
                                            msg: "New custom field has been added for the logged in user",
                                            User: req.body.UserId
                                        });
                                    }
                                }
                            );
                        }
                    } else {
                        getFieldName = function() { //Get the FieldName already presentfor that particular FormId
                            return new Promise((resolve, reject) => {
                                db.query(
                                    `SELECT FieldName FROM FormField WHERE FormId = ${db.escape(FormId)};`,
                                    (err, result) => {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            resolve(result);
                                        }
                                    }
                                );
                            });
                        }

                        getFieldName().then(function(result) {
                                let dbparameters = [];
                                for (let i = 0; i < result.length; i++) {
                                    dbparameters.push(result[i]['FieldName']);
                                }
                                //AdditionalElements will have only those fields which are getting added
                                var additionalelements = FormFieldName.filter(f => !dbparameters.includes(f));
                                for (var i = 0; i < additionalelements.length; i++) {
                                    let type = FieldNameType[additionalelements[i]];
                                    db.query(
                                        `INSERT INTO FormField(FormID,FieldTypeId,FieldName) VALUES(${db.escape(FormId)},${db.escape(fieldtype[type])},${db.escape(additionalelements[i])});`,
                                        (err, result) => {
                                            if (err) {
                                                return res.status(400).send({
                                                    msg: err
                                                });
                                            } else {
                                                return res.status(200).send({
                                                    msg: "New custom field" + additionalelements[i] + "has been added for the logged in user",
                                                    User: req.body.UserId
                                                });
                                            }
                                        }
                                    );
                                }
                            })
                            .catch(function(err) {
                                return res.status(400).send({
                                    msg: err
                                });
                            });


                    }
                })
                .catch(function(err) {
                    return res.status(400).send({
                        msg: err
                    });
                });


        })
        .catch(function(err) {
            return res.status(400).send({
                msg: err
            });
        });

});

module.exports = router;