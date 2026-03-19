package com.digao.digao_oauth_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

import com.digao.digao_oauth_service.infra.persistence.FlywayConfig;

@SpringBootApplication
@Import(FlywayConfig.class)
public class DigaoOauthServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(DigaoOauthServiceApplication.class, args);
	}

}
