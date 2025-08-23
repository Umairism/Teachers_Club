import { User, Article, Confession, Comment } from '../types';

// UUID generator function for browser compatibility
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class DatabaseService {
  private storageKey = 'benchmark_school_data';
  
  private getStorage() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {
      users: [],
      articles: [],
      confessions: [],
      comments: []
    };
  }

  private setStorage(data: any) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Users
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const data = this.getStorage();
    const user: User = {
      ...userData,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    data.users.push(user);
    this.setStorage(data);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const data = this.getStorage();
    return data.users.find((user: User) => user.email === email) || null;
  }

  async getUsers(): Promise<User[]> {
    const data = this.getStorage();
    return data.users;
  }

  // Articles
  async createArticle(articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments'>): Promise<Article> {
    const data = this.getStorage();
    const article: Article = {
      ...articleData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      comments: []
    };
    data.articles.push(article);
    this.setStorage(data);
    return article;
  }

  async getArticles(status?: 'draft' | 'published'): Promise<Article[]> {
    const data = this.getStorage();
    const articles = data.articles || [];
    return status ? articles.filter((article: Article) => article.status === status) : articles;
  }

  async getArticlesByAuthor(authorId: string): Promise<Article[]> {
    const data = this.getStorage();
    return data.articles.filter((article: Article) => article.authorId === authorId);
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
    const data = this.getStorage();
    const index = data.articles.findIndex((article: Article) => article.id === id);
    if (index === -1) return null;
    
    data.articles[index] = {
      ...data.articles[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.setStorage(data);
    return data.articles[index];
  }

  // Confessions
  async createConfession(confessionData: Omit<Confession, 'id' | 'createdAt' | 'likes'>): Promise<Confession> {
    const data = this.getStorage();
    const confession: Confession = {
      ...confessionData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      likes: 0
    };
    data.confessions.push(confession);
    this.setStorage(data);
    return confession;
  }

  async getConfessions(): Promise<Confession[]> {
    const data = this.getStorage();
    return data.confessions || [];
  }

  async getConfessionsByAuthor(authorId: string): Promise<Confession[]> {
    const data = this.getStorage();
    return data.confessions.filter((confession: Confession) => confession.authorId === authorId);
  }

  async deleteConfession(id: string, authorId: string): Promise<boolean> {
    const data = this.getStorage();
    const index = data.confessions.findIndex((confession: Confession) => 
      confession.id === id && confession.authorId === authorId
    );
    if (index === -1) return false;
    
    data.confessions.splice(index, 1);
    this.setStorage(data);
    return true;
  }

  // Initialize demo data
  async initializeDemoData(): Promise<void> {
    const data = this.getStorage();
    if (data.users.length > 0) return; // Already initialized

    // Create demo admin user
    const adminUser = await this.createUser({
      email: 'admin@benchmark.edu',
      name: 'Admin User',
      role: 'admin'
    });

    // Create demo articles
    await this.createArticle({
      title: 'Welcome to Benchmark School System',
      content: 'This is a comprehensive platform for educational excellence. Here you can share knowledge, connect with peers, and build a strong learning community.',
      excerpt: 'Welcome to our modern school management platform',
      author: adminUser,
      authorId: adminUser.id,
      category: 'announcement',
      tags: ['welcome', 'introduction'],
      status: 'published'
    });

    // Create demo confessions
    await this.createConfession({
      content: 'I love the new digital learning environment! It makes studying so much more interactive.',
      authorId: adminUser.id,
      isAnonymous: true,
      category: 'academic'
    });
  }
}

export const db = new DatabaseService();
