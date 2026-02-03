package com.digao.digao_oauth_service.presentation.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.digao.digao_oauth_service.application.dto.groups.CreateGroupRequest;
import com.digao.digao_oauth_service.application.dto.groups.GroupResponse;
import com.digao.digao_oauth_service.application.dto.groups.UpdateGroupRequest;
import com.digao.digao_oauth_service.application.usecases.groups.CreateGroupUseCase;
import com.digao.digao_oauth_service.application.usecases.groups.GetGroupUseCase;
import com.digao.digao_oauth_service.application.usecases.groups.ListGroupsUseCase;
import com.digao.digao_oauth_service.application.usecases.groups.UpdateGroupUseCase;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/groups")
@Validated
public class AdminGroupsController {
    private final ListGroupsUseCase listGroupsUseCase;
    private final GetGroupUseCase getGroupUseCase;
    private final CreateGroupUseCase createGroupUseCase;
    private final UpdateGroupUseCase updateGroupUseCase;

    public AdminGroupsController(
        ListGroupsUseCase listGroupsUseCase,
        GetGroupUseCase getGroupUseCase,
        CreateGroupUseCase createGroupUseCase,
        UpdateGroupUseCase updateGroupUseCase
    ) {
        this.listGroupsUseCase = listGroupsUseCase;
        this.getGroupUseCase = getGroupUseCase;
        this.createGroupUseCase = createGroupUseCase;
        this.updateGroupUseCase = updateGroupUseCase;
    }

    @GetMapping
    public List<GroupResponse> list() {
        return listGroupsUseCase.execute();
    }

    @GetMapping("/{id}")
    public GroupResponse get(@PathVariable String id) {
        return getGroupUseCase.execute(id);
    }

    @PostMapping
    public ResponseEntity<GroupResponse> create(@RequestBody @Valid CreateGroupRequest request) {
        GroupResponse response = createGroupUseCase.execute(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public GroupResponse update(
        @PathVariable String id,
        @RequestBody @Valid UpdateGroupRequest request
    ) {
        return updateGroupUseCase.execute(id, request);
    }
}
