import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new role' })
    @ApiResponse({ status: 201, description: 'The role has been successfully created.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    async create(@Body() createRoleDto: CreateRoleDto, @Req() req: RequestWithUser) {
        if (!this.roleService.isSuperAdmin(req.user.roles.map(role => role.name))) {
            throw new ForbiddenException('Only SUPERADMIN can create roles');
        }
        return this.roleService.create(createRoleDto, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all roles' })
    @ApiResponse({ status: 200, description: 'Return all roles.' })
    findAll() {
        return this.roleService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a role by id' })
    @ApiResponse({ status: 200, description: 'Return the role.' })
    @ApiResponse({ status: 404, description: 'Role not found.' })
    findOne(@Param('id') id: string) {
        return this.roleService.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a role' })
    @ApiResponse({ status: 200, description: 'The role has been successfully updated.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiResponse({ status: 404, description: 'Role not found.' })
    async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @Req() req: RequestWithUser) {
        if (!this.roleService.isSuperAdmin(req.user.roles.map(role => role.name))) {
            throw new ForbiddenException('Only SUPERADMIN can update roles');
        }
        return this.roleService.update(+id, updateRoleDto, req.user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a role' })
    @ApiResponse({ status: 200, description: 'The role has been successfully deleted.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiResponse({ status: 404, description: 'Role not found.' })
    async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
        if (!this.roleService.isSuperAdmin(req.user.roles.map(role => role.name))) {
            throw new ForbiddenException('Only SUPERADMIN can delete roles');
        }
        return this.roleService.remove(+id, req.user.id);
    }
}