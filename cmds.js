
const {log, biglog, errorlog, colorize} = require("./out");
const model = require('./model');


/**
 * Muestra la ayuda.
 */
exports.helpCmd = rl => {
    log("Comandos:");
    log('h|help - Muestra esta ayuda.');
    log('list - Listar los quizes existentes.');
    log('show <id> - Muestra la pregunta y la respuesta del quiz indicado');
    log('add - Añadir un nuevo quiz interactivamente.');
    log('delete <id> - Borrar el quiz indicado.');
    log('edit <id> - Editar el quiz indicado.');
    log('test <id> - Probar el quiz indicado.');
    log('p|play - Jugar a preguntar aleatoriamente todos los quizes.');
    log('credits - Créditos.');
    log('q|quit - Salir del programa');
    rl.prompt();
};
/**
 * Terminar el programa.
 */
exports.quitCmd = rl => {
    rl.close();
    rl.prompt();
};

/**
 * Lista todos los quizes existentes en el modelo. 
 */
exports.listCmd = rl => {

    model.getAll().forEach((quiz, id) => {

        log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
    });
    rl.prompt();
};

/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 */
exports.addCmd = rl => {
    rl.question(colorize(" Introduzca una pregunta: ", "red"), question =>{
        rl.question(colorize(" Introduzca una respuesta: ", "red"), answer =>{
            model.add(question, answer);
            log(` [${colorize("Se ha añadido", 'magenta')}]: ${question} ${colorize('=>','magenta')} ${answer}`);
            rl.prompt();
        });
    });
};

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 *
 * @param id Clave
 */
exports.showCmd = (rl,id) => {

    if (typeof id === "undefined"){
        errorlog(`Falta el parámetro id`);
    }else{
        try{
            const quiz = model.getByIndex(id);
            log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
        } catch(error){
            errorlog(error.message);
        }
    }


    rl.prompt();
};
/**
* Permite probar el quiz indicado.
*/
exports.testCmd = (rl,id) =>{
    if (typeof id === "undefined"){
        errorlog(`Falta el parámetro id`);
        rl.prompt();
    }else{
        try{

        const quiz = model.getByIndex(id);    

        rl.question(`${colorize(quiz.question, 'red')} `, question => {     
                if(question.toUpperCase() === quiz.answer.toUpperCase()){
                    log("Su respuesta es correcta");
                    biglog('CORRECTA','green');
                }else{
                    log("Su respuesta es incorrecta");
                    biglog('INCORRECTA', 'red');
                }
                rl.prompt();
            });
        } catch(error){
            errorlog(error.message);
            rl.prompt();
        }
    }
};
/**
 * Borra el quiz del modelo
 *
 * @param id Clave
 */
exports.deleteCmd = (rl,id)=> {
    
    if (typeof id === "undefined"){
        errorlog(`Falta el parámetro id`);
    }else{
        try{
            model.deleteByIndex(id);
        } catch(error){
            errorlog(error.message);
        }
    }
    rl.prompt();
};

/**
 * Edita un quiz del modelo
 *
 * @param id Clave
 */
exports.editCmd = (rl,id)=> {
    if (typeof id === "undefined"){
        errorlog(`Falta el parámetro id`);
        rl.prompt();
    }else{
        try{

        const quiz = model.getByIndex(id);    

        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

        rl.question(colorize(" Introduzca una pregunta: ", "red"), question =>{
            
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
    
                rl.question(colorize(" Introduzca una respuesta: ", "red"), answer =>{
                        model.update(id, question, answer);
                        log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>','magenta')} ${answer}`);
                        rl.prompt();
                });
            });
        } catch(error){
            errorlog(error.message);
            rl.prompt();
        }
    }
};

/**
 * Muestra los nombres de los autores de la práctica.
 */
exports.creditsCmd = rl => {
    log('Autor de la práctica:',"green");
   	log("Sergio Framiñán García","green");
   	rl.prompt();
};

/**
*Pregunta todos los quizes existentes en el modelo en orden aleatorio.
*Se gana si se contesta a todos satisfactoriamente.
*/
exports.playCmd = rl => {
	
    let score = 0;
    let toBeResolved = [];
    let total = model.count();
    //log(`${prueba}`, "red");   
    for (var i = 0; i < model.count(); i++) {
        toBeResolved[i]=i;
        //log(`${i}`, "red"); 
    };
const aleatorio = () => {
    id = Math.floor(Math.random()*toBeResolved.length);
}

const playOne = () => {

    if (toBeResolved.length === 0){
        log("No hay más preguntas que responder", "red");
        rl.prompt();
    
    }else{

        aleatorio();

        while(toBeResolved[id]==="a"){
            aleatorio();
        }

        //let id = Math.floor(Math.random()*toBeResolved.length);
        let quiz = model.getByIndex(id);


        toBeResolved.splice(id,1,"a");
        
            rl.question(`${colorize(quiz.question, 'red')} `, question => {
                
                if(question.toUpperCase() === quiz.answer.toUpperCase()){
                    score+=1;
                    total-=1;

                    if(total === 0){
                        log(`No hay nada más que preguntar\nFin del juego. Aciertos: ${score}`);
                        biglog(`${score}`, "magenta");
                    }else{
                            log(`CORRECTO - Lleva ${score} aciertos`);
                            playOne();
                        };
                }else{
                    log(`INCORRECTO\nFin del juego. Aciertos: ${score}`);
                    biglog(`${score}`, 'red');
                }
                rl.prompt();
            });
        };

}
playOne();

};
