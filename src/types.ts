import express = require('express');
import { Profile, Strategy } from 'passport';
import { JwtFromRequestFunction } from 'passport-jwt';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { DynamicModule, ForwardReference, Type } from '@nestjs/common';

// export const strategiesRequirer = {
//   oauth2: () => require('passport-oauth2').Strategy,
//   facebook: () => require('passport-facebook').Strategy,
//   google: () => require('passport-google-oauth20').Strategy,
//   linkedin: () => require('passport-linkedin-oauth2').Strategy,
//   twitter: () => require('passport-twitter').Strategy,
//   line: () => require('passport-line-auth').Strategy,
//   slack: () => require('passport-slack').Strategy,
//   discord: () => require('passport-discord').Strategy,
// }

// import { StrategyOptions as Oauth2StrategyOption } from 'passport-oauth2';
// import { StrategyOption as FacebookStrategyOption } from 'passport-facebook';
// import { IStrategyOption as TwitterStrategyOption } from 'passport-twitter';
// import { StrategyOptions as GoogleStrategyOption } from 'passport-google-oauth20';
// import { StrategyOption as LinkedinStrategyOption } from 'passport-linkedin-oauth2';
// import { StrategyOptions as DiscordStrategyOption } from 'passport-discord';

// export interface LineStrategyOption {
//   state: boolean;
//   channelID: string;
//   channelSecret: string;
//   callbackURL: string;
//   scope?: string;
// }

// export interface SlackStrategyOption {
//   clientID: string;
//   clientSecret: string;
//   callbackURL?: string;
//   scope?: string[];
// }

export const USER_ENTITY = Symbol('USER_ENTITY');
export const USER_SERVICE = Symbol('USER_SERVICE');
export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

export type NestModule =
  | DynamicModule
  | Type<any>
  | Promise<DynamicModule>
  | ForwardReference<any>;

export type PassportVerifyFunction = (
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  done: (error: any, user?: any, info?: any) => void,
) => void;

export type PassportVerifyFunctionWithRequest = (
  req: express.Request,
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  done: (error: any, user?: any, info?: any) => void,
) => void;

export interface PassportCallbackData<R = any, U = any, I = any, S = any> {
  err: Error;
  rawErr: R;
  user: U;
  info: I;
  status: S;
}

export interface JwtOptions extends JwtModuleOptions {
  jwtFromRequest?: () => JwtFromRequestFunction;
  refresh?: JwtSignOptions;
}

export interface AuthModuleConfig {
  enableRefreshTokenRotation?: boolean;
  passwordHashSecret?: string;
  jwt?: JwtOptions;
  recovery?: {
    tokenExpiresIn?: number; //seconds
    tokenSecret?: string; // must be at least 32 characters
  };
  passportStrategies?: Strategy[];
}

export interface AuthModuleOptions<
  Entity extends ObjectLiteral = ObjectLiteral,
  JwtPayload extends ObjectLiteral = ObjectLiteral,
  RegisterDTO extends ObjectLiteral = ObjectLiteral,
> {
  authKey: string; // must be at least 32 characters
  typeormUserEntity?: EntityTarget<Entity>;
  userService?: typeof UserAuthServiceType<Entity, JwtPayload, RegisterDTO>;
  imports?: NestModule[];
  disableRouter?: boolean;
  config?: AuthModuleConfig;
}

export interface JwtPayload<T = any> {
  sub: T;
}

export abstract class UserAuthServiceType<Entity, JwtPayloadSub, RegisterDTO> {
  public IDField = 'id';
  public dbIdentityFields?: string[];
  public dbPasswordField?: string;
  public requestUsernameField?: string;
  public requestPasswordField?: string;

  constructor(...args: any[]) {
    return this;
  }

  abstract register(data: RegisterDTO): Promise<{ user: Entity, token: string }>;
  abstract login(username: string, password: string): Promise<Entity>;
  abstract generateForgotPasswordToken(
    identityValue: string,
  ): Promise<{ user: Entity; token: string }>;
  abstract verifyToken(
    identityValue: string,
    ignoreExpired?: boolean,
  ): Promise<{ user: Entity; createdAt: number }>;
  abstract createJwtAccessTokenPayload(
    user: Entity,
  ): Promise<JwtPayload<JwtPayloadSub>>;
  abstract createJwtRefreshTokenPayload(
    user: Entity,
  ): Promise<JwtPayload<Partial<JwtPayloadSub>>>;
  abstract jwtValidator(payload: JwtPayloadSub): Promise<Entity>;
  abstract hashPassword(input: string): Promise<string>;
  abstract verifyPassword(
    input: string,
    hashedPassword: string,
  ): Promise<boolean>;
  abstract changePassword(
    user: Entity,
    newPassword: string,
    isForgot?: boolean,
    oldPassword?: string,
  ): Promise<boolean>;

  abstract onBeforePassportAuthenticateResponse(
    provider: string,
    data: PassportCallbackData,
  ): Promise<any>;
  abstract onBeforeRegisterResponse(
    body: RegisterDTO,
    token: string,
    user: Entity,
  ): Promise<any>;
  abstract onBeforeForgotPasswordResponse(
    user: Entity,
    token: string,
  ): Promise<any>;
  abstract onBeforeVerifyForgotPasswordResponse(
    user: Entity,
    token: string,
    createdAt: number,
  ): Promise<any>;
  abstract onBeforeVerifyRegisterResponse(
    user: Entity,
    token: string,
    createdAt: number,
  ): Promise<any>;
  abstract onBeforeChangePasswordResponse(
    user: Entity,
    oldPassword: string,
    newPassword: string,
    success: boolean,
  ): Promise<any>;
  abstract onBeforeLogoutResponse(accessToken: string): Promise<any>;
  abstract onBeforeLoginResponse(
    user: Entity,
    refreshToken: string,
    accessToken: string,
    refreshTokenExpiresAt: number,
    accessTokenExpiresAt: number,
  ): Promise<any>;
  abstract onBeforeRefreshTokenResponse(
    user: Entity,
    refreshToken: string,
    accessToken: string,
    refreshTokenExpiresAt: number,
    accessTokenExpiresAt: number,
  ): Promise<any>;
}
