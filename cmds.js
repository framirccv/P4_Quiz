
const {log, biglog, errorlog, colorize} = require("./out");

const Sequelize = require('sequelize');

const {models} = require('./model');


/**
 * Muestra la ayuda.
 */
exports.helpCmd = (socket, rl) => {
    log(socket, "Comandos:");
    log(socket, 'h|help - Muestra esta ayuda.');
    log(socket, 'list - Listar los quizes existentes.');
    log(socket, 'show <id> - Muestra la pregunta y la respuesta del quiz indicado');
    log(socket, 'add - Añadir un nuevo quiz interactivamente.');
    log(socket, 'delete <id> - Borrar el quiz indicado.');
    log(socket, 'edit <id> - Editar el quiz indicado.');
    log(socket, 'test <id> - Probar el quiz indicado.');
    log(socket, 'p|play - Jugar a preguntar aleatoriamente todos los quizes.');
    log(socket, 'credits - Créditos.');
    log(socket, 'q|quit - Salir del programa');
    rl.prompt();
};
/**
 * Terminar el programa.
 */
exports.quitCmd = (socket, rl) => {
    rl.close();
    socket.end();
};

/**
 * Lista todos los quizes existentes en el modelo. 
 */
exports.listCmd = (socket, rl) => {

    models.quiz.findAll()
    .each(quiz => {
            log(socket, ` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question}`);
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


const makeQuestion = (rl,text) => {
    
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};   


/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 */
exports.addCmd = (socket, rl) => {
    makeQuestion(rl, 'Introduzca una pregunta: ')
    .then(q => {
        return makeQuestion(rl, 'Introduzca la respuesta ')
        .then(a => {
            return {question: q, answer: a};
        });
    })
    .then(quiz => {
        return models.quiz.create(quiz);
    })
    .then((quiz) => {
        log(socket, ` ${colorize('Se ha añadido','magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};



const validateId = id => {
    
    return new Sequelize.Promise((resolve,reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parametro <id>.`));
        } else {
            id = parseInt(id);
            if (Number.isNaN(id)) {
                reject( new Error(`El valor del parametro <id< no es un numero`));
            } else {
                resolve(id);
            }
        }
    });
};




/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 *
 * @param id Clave
 */
exports.showCmd = (socket, rl,id) => {

    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};
/**
* Permite probar el quiz indicado.
*/
exports.testCmd = (socket, rl,id) =>{
    
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        return makeQuestion(rl, ' Introduzca la respuesta: ')
        .then(a => {
            if(quiz.answer.toUpperCase() === a.toUpperCase().trim()){
                log(socket, "Su respuesta es correcta");
                biglog(socket, 'Correcta', 'green');
            } else{
                log(socket, "Su respuesta es incorrecta");
                biglog(socket, 'Incorrecta', 'red');
            }
        });
        
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};
/**
 * Borra el quiz del modelo
 *
 * @param id Clave
 */
exports.deleteCmd = (socket, rl,id)=> {
    
    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/**
 * Edita un quiz del modelo
 *
 * @param id Clave
 */
exports.editCmd = (socket, rl,id)=> { //FALTA EL SOCKET, HASTA AQUI LLEGUE
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
        return makeQuestion(rl, ' Introduzca la pregunta: ')
        .then(q => {
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
            return makeQuestion(rl, ' Introduzca la respuesta ')
            .then(a => {
                quiz.question = q;
                quiz.answer = a;
                return quiz;
            });
        });
    })
    .then(quiz => {
        return quiz.save();
    })
    .then(quiz => {
        log(socket, `Se ha cambiado el quiz ${colorize(id,'magenta')} por: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/**
 * Muestra los nombres de los autores de la práctica.
 */
exports.creditsCmd = (socket, rl) => {
    log(socket, 'Autor de la práctica:',"green");
   	log(socket, "Sergio Framiñán García","green");
   	rl.prompt();
};

/**
*Pregunta todos los quizes existentes en el modelo en orden aleatorio.
*Se gana si se contesta a todos satisfactoriamente.
*/
exports.playCmd = (socket, rl) => {

    let score = 0;
    let toBeResolved = [];
    

    const playOne = () => {
        return new Promise((resolve,reject) => {
            
            if(toBeResolved.length <=0){
                log(socket, "No hay nada mas que preguntar.\nFin del examen. Aciertos:");
                resolve();
                return;
            }
            let id = Math.floor(Math.random()*toBeResolved.length);
            let quiz = toBeResolved[id];
            toBeResolved.splice(id,1);
            
            makeQuestion(rl, quiz.question+'? ')
            .then(answer => {
                if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
                    score++;
                    log(socket, `CORRECTO - Lleva ${score} aciertos.`);
                    resolve(playOne());
                } else {
                    log(socket, "INCORRECTO.\nFin del examen. Aciertos:");
                    resolve();
                }   
            })
        })
    }
    
    models.quiz.findAll({raw: true})
    .then(quizzes => {
        toBeResolved = quizzes;
    })
    .then(() => {
        return playOne();
    })
    .catch(error => {
        log(socket, error);
    })
    .then(() => {
        biglog(socket, score,'magenta');
        rl.prompt();
    })
};
