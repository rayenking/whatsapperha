import fs from 'fs';
import { Collection, Db } from 'mongodb';
import { ParseMessage } from './message';
import RHDatabase from './mongodb';
import { AnyMessageContent, MiscMessageGenerationOptions, WASocket } from './baileys/lib';

class UtilsRH {
  private client: WASocket;
  private db: RHDatabase;
  private database: Db;
  public admins: Collection;
  public limit: Collection;
  public settings: Collection;
  public whitelist: Collection;
  public owners: string[];

  constructor(client: WASocket, db: RHDatabase) {
    this.client = client;
    this.db = db;
    this.database = this.db.useDatabase('erha');

    this.admins = this.database.collection('admins');
    this.limit = this.database.collection('limit');
    this.settings = this.database.collection('settings');
    this.whitelist = this.database.collection('whitelist');

    this.owners = [];

    this.limit.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
  }

  saveJSON(data: any, filepath: string): void {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filepath, jsonData);
  }

  loadJSON(filepath: string): any {
    let data = {};
    try {
      const directory = filepath.substring(0, filepath.lastIndexOf('/'));
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      if (fs.existsSync(filepath)) {
        const fileData = fs.readFileSync(filepath, 'utf-8');
        data = JSON.parse(fileData);
      } else {
        this.saveJSON(data, filepath);
      }
    } catch (err) {
      console.error(err);
    }
    return data;
  }

  markdown(text: string): string {
    return '```' + text + '```';
  }

  response(text: string, parseMention: boolean): string {
    text = text.replace('[', '╭─');
    text = text.replace(/\|/g, '├');
    text = text.replace(']', '╰─');
    if (text.indexOf('@s.whatsapp.net') > -1 && parseMention) {
      text = text.replace(/(\d+)@s.whatsapp.net/g, '@$1');
    }
    return text;
  }

  async isAdmin(m: any): Promise<boolean> {
    if (this.owners.includes(m.parse.sender)) return true;
    let data = await this.admins.findOne({ to: m.parse.to });
    if (data) {
      if (data.admins.includes(m.parse.sender)) return true;
      return false;
    }
    return false;
  }

  async addWhitelist(m: ParseMessage, number: string): Promise<boolean> {
    if (this.owners.includes(m.parse.sender)){
      await this.whitelist.insertOne({ number });
      return true
    }
    return false
  }

  async delWhitelist(m: ParseMessage, number: string): Promise<boolean> {
    if (this.owners.includes(m.parse.sender)){
      await this.whitelist.deleteOne({ number })
      return true
    }
    return false
  }

  async listWhitelist(m: ParseMessage): Promise<string> {
    if (this.owners.includes(m.parse.sender)){
      const whitelists = await this.whitelist.find({}).toArray()
      let result = 'List WL\n'
      whitelists.forEach(wl => {
        result += `\n${wl.number} | wa.me/${wl.number}`
      })
      return result
    }
    return ''
  }

  async isWhitelist(number: string): Promise<boolean> {
    if (this.owners.includes(number + '@s.whatsapp.net')) return true;
    let data = await this.whitelist.findOne({ number: number });
    if (data) {
      return true
    }
    return false;
  }

  async isLimit(m: { parse: { sender: string } }, limitName: string): Promise<boolean> {
    // Check if user is an owner or admin
    if (await this.isAdmin(m)) return false;

    // Check if user has reached the limit
    let data = await this.limit.findOne({ name: limitName, sender: m.parse.sender });
    if (!data) {
      // If no previous limit exists, create a new one with limit of 2 and expiration time 24 hours from now
      await this.limit.insertOne({
        name: limitName,
        sender: m.parse.sender,
        limit: 2,
        expireAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // Set expiration time to 24 hours from now
      });
    } else if (data.limit <= 0) {
      // If user has reached the limit, return true
      return true;
    } else {
      // If user has not reached the limit, decrement the limit and update the expiration time
      await this.limit.updateOne({ name: limitName, sender: m.parse.sender }, {
        $set: {
          limit: data.limit - 1,
          expireAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // Update expiration time to 24 hours from now
        }
      });
    }

    return false;
  }

  removeCmd(m: { parse: { text: string } }): string {
    let sep = m.parse.text.split(' ');
    return m.parse.text.slice((sep[0] + ' ').length);
  }

  encodeJsonB64(data: any): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  decodeJsonB64(text: string): any {
    return JSON.parse(Buffer.from(text, 'base64').toString());
  }

  async sleep (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async sendMessageWithResponse(to: string, data: AnyMessageContent, options?: MiscMessageGenerationOptions | undefined): Promise<void> {
    await this.client.sendMessage(to, { text: this.markdown('please wait...') });
    try {
      await this.client.sendMessage(to, data, options);
    } catch (error) {
      await this.client.sendMessage(to, { text: this.markdown('sending failed! try again.') });
    }
  }

  isAnswerCorrect(userInput: string, correctAnswer: string): boolean {
    const threshold = 0.8; // Set a threshold for similarity score
    userInput = this.preprocessString(userInput); // Preprocess the strings
    correctAnswer = this.preprocessString(correctAnswer);
    const distance = this.levenshteinDistance(userInput, correctAnswer);
    const maxLength = Math.max(userInput.length, correctAnswer.length);
    const similarityScore = 1 - distance / maxLength;

    return similarityScore >= threshold;
  }

  preprocessString(str: string): string {
    return str.toLowerCase().replace(/[-\s]/g, ''); // Convert to lowercase and remove spaces and dashes
  }

  levenshteinDistance(a: string, b: string): number {
    const m = a.length, n = b.length;
    let dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 1; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= m; i++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
        }
      }
    }
    return dp[m][n];
  }
}

export default UtilsRH;
