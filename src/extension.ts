import * as vscode from 'vscode';
import { getDatabaseContext, runQuery } from './utils';


//handle error
//code tour
export function activate(context: vscode.ExtensionContext) {

    let last_response: string = "";
    let last_sql_query: string = "";
    

    // Register chat participant and handler to respond to user queries
    vscode.chat.createChatParticipant("vscode-mssql-chat", async (request, context, response, token) => {

        const userQuery = request.prompt;
        response.progress('Reading database context...');

        try{
            // Select what model you want to talk to
            const chatModels = await vscode.lm.selectChatModels({ family: 'gpt-4' });

            // Check if the command is 'explainQuery'
            if (request.command == 'explainQuery') {
                if (last_sql_query) {
                    try {
                        const explanationMessages = [
                            vscode.LanguageModelChatMessage.User("I have the following SQL code that I need help understanding:"),
                            vscode.LanguageModelChatMessage.User(`\`\`\`sql\n${last_sql_query}\n\`\`\``),
                            vscode.LanguageModelChatMessage.User("Please provide a detailed and simple explanation of the above SQL code only.")
                        ];

                        const explanationRequest = await chatModels[0].sendRequest(explanationMessages, {}, token);
                        let explanationData = ''; // Response data from model
                        for await (const token of explanationRequest.text) {
                            response.markdown(token);
                            explanationData += token;
                        }
                    } catch (err) {
                        response.markdown('Error explaining SQL code!');
                    }

                    console.log("test");
                    return { metadata: { command: 'explainQuery' } };
                } else {
                    response.markdown('No SQL query found to explain.');
                }
                return; // Ensure we return after handling explainQuery
            }
            else if (request.command == 'getDatabaseDetails') {
                try {
                    const dbContext = await getDatabaseContext();
                    console.log(dbContext);

                    const messages = [
                        vscode.LanguageModelChatMessage.User("Generate a short description about the database schema based on the following context."),
                        vscode.LanguageModelChatMessage.User(dbContext)
                    ];
                    const chatRequest = await chatModels[0].sendRequest(messages, {}, token);
                    let data = ''; // Response data from model
                    for await (const token of chatRequest.text) {
                        response.markdown(token);
                        data += token;
                    }
                } catch (err) {
                    response.markdown('Error retrieving database context!');
                }
                return;
            }
    
            // Normal query suggestion handling
            const messages = [
                vscode.LanguageModelChatMessage.User("You should suggest a SQL query for my task that begins with ```sql and ends with ```."),
                vscode.LanguageModelChatMessage.User(await getDatabaseContext() + '\n' + userQuery) // We get the database context and append it to user request for the model
            ];
            const chatRequest = await chatModels[0].sendRequest(messages, undefined, token);
            let data = ''; // Response data
            for await (const token of chatRequest.text) {
                response.markdown(token);
                data += token;
                last_response += token;
            }


            // Check if we got a SQL query as the response, if yes, we want to enable a button to run the query in the editor
            const sqlRegex = /```[^\n]*\n([\s\S]*)\n```/g;
            const match = sqlRegex.exec(data);

            if (match && match[1]) {
                last_sql_query = match[1];
                response.button({ title: 'Run Query', command: 'vscode-mssql-chat.runQuery', arguments: [match[1]] });
            }
        }
        catch (err){
            response.markdown('Error ocurred during chat request, the error message is: ${err.message}')
        }

    });

    
    // Register a command to run the SQL query from the chat response
    vscode.commands.registerCommand('vscode-mssql-chat.runQuery', async (sqlQuery: string) => {
        try {
            const result = await runQuery(sqlQuery);
            const resultString = JSON.stringify(result, null, 2);

            // Create a new document and show the result
            const doc = await vscode.workspace.openTextDocument({ content: resultString, language: 'json' });
            await vscode.window.showTextDocument(doc, { preview: false });
        } catch (err) {
            vscode.window.showErrorMessage('Error running query');
        }
    });
}


export function deactivate() {
    // Clean up
}
