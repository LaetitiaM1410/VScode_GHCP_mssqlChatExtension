# Chat Example

Offical docu + example demo: https://code.visualstudio.com/api/extension-guides/chat

This sample shows

- How to contribute a chat participant.
- How to use the chatRequestAccess API to request access to the chat.
- How to respond with follow-ups.


This sample shows a chat extension that implements a mssql chat participant that interacts with the connected Azure SQL database to generate SQL code based on natural language.

## Running the Sample

- Create resources: Azure SQL Server + database to store your sample data
- Install the MS SQL Extension
	- now a SQL Server tab will appear on left bar where you can connect your server
	-> follow the steps appearing to insert your DB table name, credetials, etc.
- Run `npm install` in terminal to install dependencies
- Run the `Run Extension` target in the Debug View. This will:
	- Start a task `npm: watch` to compile the code
	- Run the extension in a new VS Code window

**Demo:**

**How to build your own chat participant?**

**Prerequisites:**
- https://code.visualstudio.com/insiders
- Pre-release version of GitHub Copilot Chat extension

**Demo:**
1. @mssql/getDatabaseDetails: provides a quick overview of the connected Azure database content
2. @mssql "generate SQL query that..." provides a SQL query from natural language
   2a) **Run Query** button: runs query and returns result as json file in new window
3. @mssql/explainQuery: explains SQL query from last response


**How to build your own Chat Participant (with code examples)**

**1. Register your chat extension in the package.json with individual id, name and fullname:**
	"contributes": {
			"chatParticipants": [
				{
					"id": "vscode-mssql-chat",
					"fullName": "mssql",
					"name": "mssql",
					"description": "Generate SQL queries from natural languange",
					"isSticky": true,
					"commands": [
						...here you add the commands which will be invoked by "/"...

**2. Create the chat participant:**

	//activate function 
	export function activate(context: vscode.ExtensionContext) {

    // Register chat participant that can respond to user queries
    vscode.chat.createChatParticipant("vscode-mssql-chat", async (request, context, response, token) => {

        const userQuery = request.prompt;
        response.progress('Reading database context...');

        // Select what model you want to talk to
        const chatModels = await vscode.lm.selectChatModels({ family: 'gpt-4' });

**3. Register commands:**

	"contributes": {
        "chatParticipants": [
            {
                "id": "vscode-mssql-chat",
                "fullName": "mssql",
                "name": "mssql",
                "description": "Generate SQL queries from natural languange",
                "isSticky": true,
                "commands": [
                    {
                        "name": "getDatabaseDetails",
                        "description": "Providing database details to you"
                    },
                    {
                        "name": "explainQuery",
                        "description": "Explaining the SQL query from previous response"
                    }
                ]
            }
        ]
        
    },


**OPTIONAL: Register follow-up questions in chat windows:**

	interface ICatChatResult extends vscode.ChatResult {
		metadata: {
			command: string;
		}
	}	

	extension.followupProvider = {
			provideFollowups(result: ICatChatResult, context: vscode.ChatContext, token: vscode.CancellationToken) {
				return [{
					prompt: 'prompt',
					label: vscode.l10n.t('label'),
					command: 'command'
				} satisfies vscode.ChatFollowup];
			}
		};

	This allows the user to select follow -up questions, which are immediately sent to the chat extension. This provides inspiriation to the user to discover more capabilities of the chat extension
