import axios, { AxiosResponse } from "axios";

export interface GitHubUser {
  login: string;
  id: number;
  html_url: string;
  avatar_url: string;
}

export async function getGitHubUser(username: string): Promise<GitHubUser | { error: string }> {
  try {
    const url = `https://api.github.com/users/${username}`;
    const response: AxiosResponse<any> = await axios.get(url);

    return {
      login: response.data.login,
      id: response.data.id,
      html_url: response.data.html_url,
      avatar_url: response.data.avatar_url,
    };
  } catch (err: any) {
    if (err.response?.status === 404) return { error: "GitHub user not found" };
    return { error: "GitHub lookup failed" };
  }
}
